#!/bin/bash
# Guangchu 定时爬虫 wrapper
# 日志输出到 ~/Library/Logs/guangchu-crawl.log

LOG_DIR="$HOME/Library/Logs"
GUANGCHU_DIR="$HOME/.openclaw/workspace/guangchu"

mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/guangchu-crawl.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始抓取..." >> "$LOG_FILE"
cd "$GUANGCHU_DIR"
python3 scripts/crawler.py >> "$LOG_FILE" 2>&1

CRAWL_EXIT=$?

if [ $CRAWL_EXIT -eq 0 ]; then
    # 检查是否有新文章，有则触发 ingest
    python3 scripts/ingest.py >> "$LOG_FILE" 2>&1
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ingest 完成" >> "$LOG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 爬虫失败，exit=$CRAWL_EXIT" >> "$LOG_FILE"
fi

echo "---" >> "$LOG_FILE"
