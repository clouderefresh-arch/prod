#!/usr/bin/env python3
"""Кладёт входящее письмо в очередь бота. Ключ Telegram здесь не используется."""

import os
import sys
import time

INBOX = os.environ.get("INBOX_PATH", "/var/lib/rama-bot/inbox")


def main():
    os.makedirs(INBOX, exist_ok=True)
    raw = sys.stdin.buffer.read()
    path = os.path.join(INBOX, f"{time.time_ns()}.eml")
    temporary = path + ".tmp"
    with open(temporary, "wb") as handle:
        handle.write(raw)
    os.replace(temporary, path)


if __name__ == "__main__":
    main()
