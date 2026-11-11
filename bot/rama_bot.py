#!/usr/bin/env python3
"""Заявки студии РАМА: одно письмо или сообщение — одна карточка."""

import csv
import email
import html
import io
import json
import os
import re
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from email import policy
from email.header import decode_header, make_header

TOKEN = os.environ.get("BOT_TOKEN", "")
ADMIN_ID = int(os.environ.get("ADMIN_ID", "0"))
API = f"https://api.telegram.org/bot{TOKEN}/"
STATE_PATH = os.environ.get("STATE_PATH", "/var/lib/rama-bot/state.json")
INBOX_PATH = os.environ.get("INBOX_PATH", "/var/lib/rama-bot/inbox")
MSK = timezone(timedelta(hours=3))
STATUS = {
    "new": "новая",
    "work": "в работе",
    "done": "готово",
    "lost": "отказ",
}
STATUS_WORDS = {
    "новая": "new",
    "новый": "new",
    "new": "new",
    "в работе": "work",
    "работе": "work",
    "работа": "work",
    "work": "work",
    "готово": "done",
    "готов": "done",
    "done": "done",
    "отказ": "lost",
    "lost": "lost",
}
OWN_DOMAINS = {"studio-rama.ru", "rama.studio"}
SKIP_LOCAL = {"hello", "postmaster", "abuse", "mailer-daemon", "noreply", "no-reply"}


def api(method, payload=None, timeout=70):
    data = None if payload is None else json.dumps(payload).encode()
    request = urllib.request.Request(
        API + method,
        data=data,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = json.load(response)
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace")
        raise RuntimeError(f"{method} {error.code} {detail}") from error
    if not body.get("ok"):
        raise RuntimeError(f"{method} failed: {body}")
    return body["result"]


def load_state():
    try:
        with open(STATE_PATH, encoding="utf-8") as handle:
            state = json.load(handle)
    except (FileNotFoundError, json.JSONDecodeError):
        state = {}
    state.setdefault("offset", 0)
    state.setdefault("routes", {})
    state.setdefault("leads", [])
    state.setdefault("seen_mail", [])
    state.setdefault("next_id", 1)
    for lead in state["leads"]:
        if "id" not in lead:
            lead["id"] = state["next_id"]
            state["next_id"] += 1
        lead.setdefault("code", f"R-{lead['id']:04d}")
        lead.setdefault("status", "new")
        lead.setdefault("source", "telegram" if lead.get("user_id") else "почта")
        lead.setdefault("email", "")
        lead.setdefault("phone", "")
        lead.setdefault("subject", "")
        lead.setdefault("telegram", lead.get("username", ""))
        lead.setdefault("text", "")
        lead.setdefault("name", "без имени")
    return state


def save_state(state):
    temporary = STATE_PATH + ".tmp"
    with open(temporary, "w", encoding="utf-8") as handle:
        json.dump(state, handle, ensure_ascii=False)
    os.replace(temporary, STATE_PATH)


def send(chat_id, text, reply_to=None, markup=None):
    payload = {"chat_id": chat_id, "text": text[:4000]}
    if reply_to:
        payload["reply_to_message_id"] = reply_to
    if markup:
        payload["reply_markup"] = markup
    return api("sendMessage", payload)


def send_document(chat_id, filename, content, caption):
    boundary = f"----Rama{time.time_ns()}"
    chunks = []

    def field(name, value):
        chunks.append(
            (
                f"--{boundary}\r\n"
                f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
                f"{value}\r\n"
            ).encode()
        )

    field("chat_id", chat_id)
    field("caption", caption)
    chunks.append(
        (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="document"; filename="{filename}"\r\n'
            "Content-Type: text/csv; charset=utf-8\r\n\r\n"
        ).encode()
    )
    chunks.append(content)
    chunks.append(f"\r\n--{boundary}--\r\n".encode())
    request = urllib.request.Request(
        API + "sendDocument",
        data=b"".join(chunks),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    with urllib.request.urlopen(request, timeout=70) as response:
        body = json.load(response)
    if not body.get("ok"):
        raise RuntimeError(f"sendDocument failed: {body}")
    return body["result"]


def person(message):
    user = message.get("from") or {}
    name = " ".join(
        part for part in (user.get("first_name"), user.get("last_name")) if part
    ).strip() or "без имени"
    username = f"@{user['username']}" if user.get("username") else ""
    return name, username, user.get("id")


def lead_text(message):
    if "text" in message:
        return message["text"].strip()
    if "caption" in message:
        return message["caption"].strip()
    if "contact" in message:
        contact = message["contact"]
        return f"{contact.get('phone_number', '')} {contact.get('first_name', '')}".strip()
    return ""


def find_email(text):
    match = re.search(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", text or "")
    return match.group(0) if match else ""


def find_phone(text):
    match = re.search(r"(?:\+?\d[\d\-\s()]{8,}\d)", text or "")
    if not match:
        return ""
    digits = re.sub(r"\D", "", match.group(0))
    if len(digits) == 11 and digits[0] in "78":
        return f"+7 {digits[1:4]} {digits[4:7]}-{digits[7:9]}-{digits[9:11]}"
    if 10 <= len(digits) <= 15:
        return f"+{digits}" if not match.group(0).strip().startswith("+") else match.group(0).strip()
    return ""


def status_keyboard(lead_id, current):
    buttons = (("work", "В работе"), ("done", "Готово"), ("lost", "Отказ"))
    row = []
    for code, label in buttons:
        title = f"· {label}" if code == current else label
        row.append({"text": title, "callback_data": f"s:{lead_id}:{code}"})
    return {"inline_keyboard": [row]}


def card(lead):
    lines = [
        f"Заявка {lead['code']} · {STATUS.get(lead['status'], lead['status'])}",
        f"Источник: {lead['source']}",
        f"От: {lead['name']}",
    ]
    if lead.get("email"):
        lines.append(f"Почта: {lead['email']}")
    if lead.get("phone"):
        lines.append(f"Телефон: {lead['phone']}")
    if lead.get("telegram"):
        lines.append(f"Telegram: {lead['telegram']}")
    if lead.get("subject"):
        lines.append(f"Тема: {lead['subject']}")
    lines.append(f"Время: {lead['at']} МСК")
    lines.append("")
    lines.append(lead.get("text") or "без текста")
    return "\n".join(lines)[:4000]


def find_lead(state, lead_id):
    for lead in state["leads"]:
        if lead.get("id") == lead_id:
            return lead
    return None


def publish(state, lead, reply_to=None):
    sent = send(ADMIN_ID, card(lead), reply_to=reply_to, markup=status_keyboard(lead["id"], lead["status"]))
    lead["admin_message_id"] = sent["message_id"]
    if lead.get("user_id"):
        state["routes"][str(sent["message_id"])] = lead["user_id"]
    return sent


def add_lead(state, **fields):
    lead_id = state["next_id"]
    state["next_id"] = lead_id + 1
    lead = {
        "id": lead_id,
        "code": f"R-{lead_id:04d}",
        "status": "new",
        "at": datetime.now(MSK).strftime("%d.%m.%Y %H:%M"),
        "user_id": None,
        "name": "без имени",
        "email": "",
        "phone": "",
        "telegram": "",
        "subject": "",
        "text": "",
        "source": "",
        "message_id": "",
    }
    lead.update(fields)
    state["leads"].append(lead)
    state["leads"] = state["leads"][-500:]
    publish(state, lead)
    save_state(state)
    return lead


def export_csv(state):
    buffer = io.StringIO()
    writer = csv.writer(buffer, delimiter=";")
    writer.writerow(
        ["Номер", "Статус", "Источник", "Время", "Имя", "Почта", "Телефон", "Telegram", "Тема", "Текст"]
    )
    for lead in state["leads"]:
        writer.writerow(
            [
                lead.get("code", ""),
                STATUS.get(lead.get("status"), ""),
                lead.get("source", ""),
                lead.get("at", ""),
                lead.get("name", ""),
                lead.get("email", ""),
                lead.get("phone", ""),
                lead.get("telegram", ""),
                lead.get("subject", ""),
                lead.get("text", ""),
            ]
        )
    return ("\ufeff" + buffer.getvalue()).encode("utf-8")


def set_status(state, lead, status):
    lead["status"] = status
    save_state(state)
    message_id = lead.get("admin_message_id")
    if not message_id:
        return
    try:
        api(
            "editMessageText",
            {
                "chat_id": ADMIN_ID,
                "message_id": message_id,
                "text": card(lead),
                "reply_markup": status_keyboard(lead["id"], status),
            },
        )
    except RuntimeError as error:
        if "message is not modified" not in str(error):
            raise


def notify_admin(state, message):
    name, username, user_id = person(message)
    text = lead_text(message)
    if not text or text.startswith("/"):
        return
    add_lead(
        state,
        source="telegram",
        name=name,
        telegram=username,
        user_id=user_id,
        email=find_email(text),
        phone=find_phone(text),
        subject="",
        text=text[:3000],
    )
    send(
        message["chat"]["id"],
        "Заявка принята. Студия РАМА свяжется с вами.",
        reply_to=message["message_id"],
    )


def command_parts(text):
    first, _, rest = text.partition(" ")
    return first.split("@", 1)[0].lower(), rest.strip()


def lead_number(value):
    match = re.fullmatch(r"(?:R-)?(\d+)", value.strip(), re.IGNORECASE)
    return int(match.group(1)) if match else None


def handle(state, message):
    chat_id = message["chat"]["id"]
    user_id = (message.get("from") or {}).get("id")
    text = lead_text(message)
    is_admin = user_id == ADMIN_ID

    if text in ("/start", "/help") or text.startswith("/start@") or text.startswith("/help@"):
        if is_admin:
            send(
                chat_id,
                "Одно письмо — одна заявка.\n"
                "Под карточкой кнопки статуса: в работе, готово, отказ.\n"
                "/list — последние заявки\n"
                "/lead R-0001 — открыть карточку\n"
                "/export — выгрузить все заявки в таблицу\n"
                "Ответ на заявку из Telegram уходит клиенту. "
                "На заявку с почты отвечайте письмом.",
            )
        else:
            send(
                chat_id,
                "Здравствуйте, это студия РАМА.\n"
                "Напишите заявку одним сообщением: имя, телефон и что нужно снять или сделать.",
            )
        return

    if is_admin and text.startswith("/"):
        name, rest = command_parts(text)
        if name == "/list":
            leads = state["leads"][-20:]
            if not leads:
                send(chat_id, "Заявок пока нет.")
                return
            lines = ["Последние заявки:"]
            for lead in reversed(leads):
                title = lead.get("subject") or lead.get("text", "").split("\n", 1)[0]
                lines.append(
                    f"{lead['code']} · {STATUS.get(lead['status'], '')} · {lead['source']} · {lead['name']} · {title[:60]}"
                )
            lines.append("\n/export выгрузит все заявки.")
            send(chat_id, "\n".join(lines)[:4000])
            return
        if name == "/export":
            send_document(
                chat_id,
                "rama-zayavki.csv",
                export_csv(state),
                "Все заявки. Файл открывается в Excel и в Google Таблицах.",
            )
            return
        if name == "/lead":
            number = lead_number(rest)
            lead = find_lead(state, number) if number else None
            if not lead:
                send(chat_id, "Нет такой заявки. Пример: /lead R-0001")
                return
            publish(state, lead)
            save_state(state)
            return
        if name == "/status":
            number_text, _, word = rest.partition(" ")
            number = lead_number(number_text)
            status = STATUS_WORDS.get(word.strip().lower())
            lead = find_lead(state, number) if number else None
            if not lead or not status:
                send(chat_id, "Пример: /status R-0001 готово")
                return
            set_status(state, lead, status)
            send(chat_id, f"{lead['code']}: {STATUS[status]}")
            return

    reply = message.get("reply_to_message") or {}
    route = state["routes"].get(str(reply.get("message_id")))
    if is_admin and route and text and not text.startswith("/"):
        send(route, f"РАМА:\n{text}")
        send(chat_id, "Ответ отправлен клиенту.", reply_to=message["message_id"])
        return

    if is_admin and reply and text and not text.startswith("/"):
        mail_card = any(lead.get("admin_message_id") == reply.get("message_id") for lead in state["leads"])
        if mail_card:
            send(chat_id, "Это заявка с почты. Ответьте клиенту письмом на адрес из карточки.")
        return

    if is_admin:
        return

    notify_admin(state, message)


def handle_callback(state, callback):
    user_id = (callback.get("from") or {}).get("id")
    if user_id != ADMIN_ID:
        api("answerCallbackQuery", {"callback_query_id": callback["id"]})
        return
    parts = (callback.get("data") or "").split(":")
    lead = find_lead(state, int(parts[1])) if len(parts) == 3 and parts[1].isdigit() else None
    status = parts[2] if lead and parts[2] in STATUS else ""
    if not lead or not status:
        api("answerCallbackQuery", {"callback_query_id": callback["id"], "text": "Заявка не найдена"})
        return
    set_status(state, lead, status)
    api(
        "answerCallbackQuery",
        {"callback_query_id": callback["id"], "text": f"{lead['code']}: {STATUS[status]}"},
    )


def header_text(value):
    if not value:
        return ""
    return str(make_header(decode_header(value)))


def part_text(part):
    try:
        content = part.get_content()
    except Exception:
        raw = part.get_payload(decode=True) or b""
        charset = part.get_content_charset() or "utf-8"
        content = raw.decode(charset, "replace")
    return content if isinstance(content, str) else str(content)


def html_text(value):
    value = re.sub(r"(?i)<br\s*/?>", "\n", value)
    value = re.sub(r"(?i)</p>", "\n", value)
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value)
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in value.splitlines()]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()


def message_body(msg):
    if msg.is_multipart():
        parts = list(msg.walk())
        plain = [
            part_text(part)
            for part in parts
            if part.get_content_type() == "text/plain" and not part.get_filename()
        ]
        if any(part.strip() for part in plain):
            return "\n".join(part for part in plain if part.strip())
        html_parts = [
            part_text(part)
            for part in parts
            if part.get_content_type() == "text/html" and not part.get_filename()
        ]
        if html_parts:
            return html_text("\n".join(html_parts))
        return ""
    content = part_text(msg)
    if msg.get_content_type() == "text/html":
        return html_text(content)
    return content


def fresh_body(text):
    kept = []
    for line in (text or "").replace("\r\n", "\n").split("\n"):
        stripped = line.strip()
        if stripped.startswith(">"):
            break
        if re.search(r"\b(wrote|писал[аи]?|написала?):\s*$", stripped, re.IGNORECASE):
            break
        if re.match(r"^(пн|вт|ср|чт|пт|сб|вс), .*<.+>", stripped, re.IGNORECASE):
            break
        if re.match(r"^On .+wrote:$", stripped, re.IGNORECASE):
            break
        kept.append(line.rstrip())
    return re.sub(r"\n{3,}", "\n\n", "\n".join(kept)).strip()


def split_sender(value):
    match = re.match(r"^(.*?)\s*<([^>]+)>\s*$", value or "")
    if match:
        address = match.group(2).strip()
        name = match.group(1).strip().strip('"') or address
        return name, address
    address = (value or "").strip()
    return (address or "без имени"), address if "@" in address else ""


def skip_mail(address, msg):
    auto = (msg.get("auto-submitted") or "").lower()
    if auto and auto != "no":
        return True
    local, _, domain = address.lower().partition("@")
    if local in SKIP_LOCAL or "noreply" in local or "no-reply" in local:
        return True
    return domain in OWN_DOMAINS


def process_mail(state):
    if not os.path.isdir(INBOX_PATH):
        return
    for name in sorted(os.listdir(INBOX_PATH)):
        path = os.path.join(INBOX_PATH, name)
        if not name.endswith(".eml") or not os.path.isfile(path):
            continue
        try:
            with open(path, "rb") as handle:
                msg = email.message_from_binary_file(handle, policy=policy.default)
            sender_name, sender_mail = split_sender(header_text(msg.get("from")))
            message_id = (msg.get("message-id") or "").strip()
            known = message_id and (
                message_id in state["seen_mail"]
                or any(lead.get("message_id") == message_id for lead in state["leads"])
            )
            if known:
                os.remove(path)
                continue
            if skip_mail(sender_mail, msg):
                os.remove(path)
                print(f"mail skipped {sender_mail}", flush=True)
                continue
            subject = header_text(msg.get("subject")) or "без темы"
            body = fresh_body(message_body(msg))[:3000]
            add_lead(
                state,
                source="почта",
                name=sender_name,
                email=sender_mail,
                phone=find_phone(f"{subject}\n{body}"),
                subject=subject,
                text=body,
                message_id=message_id,
            )
            if message_id:
                state["seen_mail"].append(message_id)
                state["seen_mail"] = state["seen_mail"][-500:]
                save_state(state)
            os.remove(path)
            print(f"mail lead {sender_mail}", flush=True)
        except Exception as error:
            failed = os.path.join(INBOX_PATH, "failed")
            os.makedirs(failed, exist_ok=True)
            os.replace(path, os.path.join(failed, name))
            print(f"mail error {name}: {error}", flush=True)


def main():
    os.makedirs(os.path.dirname(STATE_PATH), exist_ok=True)
    os.makedirs(INBOX_PATH, exist_ok=True)
    api("deleteWebhook", {"drop_pending_updates": False})
    state = load_state()
    save_state(state)
    while True:
        try:
            process_mail(state)
        except Exception as error:
            print(f"mail error: {error}", flush=True)
        try:
            updates = api(
                "getUpdates",
                {
                    "timeout": 25,
                    "offset": state["offset"],
                    "allowed_updates": ["message", "callback_query"],
                },
            )
        except Exception as error:
            print(f"poll error: {error}", flush=True)
            time.sleep(3)
            continue
        for update in updates:
            state["offset"] = update["update_id"] + 1
            try:
                if update.get("callback_query"):
                    handle_callback(state, update["callback_query"])
                elif update.get("message"):
                    handle(state, update["message"])
            except Exception as error:
                print(f"handle error: {error}", flush=True)
            save_state(state)


if __name__ == "__main__":
    main()
