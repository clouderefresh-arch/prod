#!/usr/bin/env python3
"""Принимает заявки в Telegram и присылает их администратору."""

import json
import os
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

TOKEN = os.environ["BOT_TOKEN"]
ADMIN_ID = int(os.environ["ADMIN_ID"])
API = f"https://api.telegram.org/bot{TOKEN}/"
STATE_PATH = os.environ.get("STATE_PATH", "/var/lib/rama-bot/state.json")
MSK = timezone(timedelta(hours=3))


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
        state = {"offset": 0, "routes": {}, "leads": []}
    state.setdefault("offset", 0)
    state.setdefault("routes", {})
    state.setdefault("leads", [])
    return state


def save_state(state):
    temporary = STATE_PATH + ".tmp"
    with open(temporary, "w", encoding="utf-8") as handle:
        json.dump(state, handle, ensure_ascii=False)
    os.replace(temporary, STATE_PATH)


def send(chat_id, text, reply_to=None):
    payload = {"chat_id": chat_id, "text": text}
    if reply_to:
        payload["reply_to_message_id"] = reply_to
    return api("sendMessage", payload)


def person(message):
    user = message.get("from") or {}
    name = " ".join(
        part for part in (user.get("first_name"), user.get("last_name")) if part
    ).strip() or "без имени"
    username = user.get("username")
    return name, f"@{username}" if username else "без username", user.get("id")


def lead_text(message):
    if "text" in message:
        return message["text"].strip()
    if "caption" in message:
        return message["caption"].strip()
    if "contact" in message:
        contact = message["contact"]
        return f"Контакт: {contact.get('phone_number', '')} {contact.get('first_name', '')}".strip()
    return ""


def notify_admin(state, message):
    name, username, user_id = person(message)
    text = lead_text(message)
    if not text or text.startswith("/"):
        return
    when = datetime.now(MSK).strftime("%d.%m.%Y %H:%M")
    notice = (
        "Новая заявка\n"
        f"От: {name} {username}\n"
        f"id: {user_id}\n"
        f"Время: {when} МСК\n\n"
        f"{text}\n\n"
        "Ответьте на это сообщение, чтобы написать клиенту."
    )
    sent = send(ADMIN_ID, notice)
    state["routes"][str(sent["message_id"])] = user_id
    state["leads"].append(
        {
            "at": when,
            "user_id": user_id,
            "name": name,
            "username": username,
            "text": text,
            "admin_message_id": sent["message_id"],
        }
    )
    state["leads"] = state["leads"][-200:]
    save_state(state)
    send(
        message["chat"]["id"],
        "Заявка принята. Студия РАМА свяжется с вами.",
        reply_to=message["message_id"],
    )


def handle(state, message):
    chat_id = message["chat"]["id"]
    user_id = (message.get("from") or {}).get("id")
    text = lead_text(message)
    is_admin = user_id == ADMIN_ID

    if text in ("/start", "/help"):
        if is_admin:
            send(
                chat_id,
                "Вы администратор. Новые заявки приходят в этот чат. "
                "Ответ на заявку уходит клиенту. Команда /list показывает последние заявки.",
            )
        else:
            send(
                chat_id,
                "Здравствуйте, это студия РАМА.\n"
                "Напишите заявку одним сообщением: имя, телефон и что нужно снять или сделать.",
            )
        return

    if is_admin and text == "/list":
        leads = state["leads"][-10:]
        if not leads:
            send(chat_id, "Заявок пока нет.")
            return
        lines = ["Последние заявки:"]
        for lead in reversed(leads):
            lines.append(f"\n{lead['at']} — {lead['name']} {lead['username']}\n{lead['text']}")
        send(chat_id, "\n".join(lines)[:4000])
        return

    reply = message.get("reply_to_message") or {}
    route = state["routes"].get(str(reply.get("message_id")))
    if is_admin and route and text and not text.startswith("/"):
        send(route, f"РАМА:\n{text}")
        send(chat_id, "Ответ отправлен клиенту.", reply_to=message["message_id"])
        return

    if is_admin:
        return

    notify_admin(state, message)


def main():
    os.makedirs(os.path.dirname(STATE_PATH), exist_ok=True)
    api("deleteWebhook", {"drop_pending_updates": False})
    state = load_state()
    while True:
        try:
            updates = api(
                "getUpdates",
                {"timeout": 30, "offset": state["offset"], "allowed_updates": ["message"]},
            )
        except Exception as error:
            print(f"poll error: {error}", flush=True)
            time.sleep(3)
            continue
        for update in updates:
            state["offset"] = update["update_id"] + 1
            message = update.get("message")
            if message:
                try:
                    handle(state, message)
                except Exception as error:
                    print(f"handle error: {error}", flush=True)
            save_state(state)


if __name__ == "__main__":
    main()
