# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## SSH 服务器 (Alibaba Cloud)

### 47.100.20.52 (solaripple.com 生产服务器)
- **Key:** `~/.ssh/solaripple.pem`
- **User:** root
- **用法:** `ssh -i ~/.ssh/solaripple.pem root@47.100.20.52`
- **服务:**
  - `pm2 list` → smartsolar-server (3003), enos-api, design-api (3013)
  - 部署路径: `/opt/design-server/`
  - Web root: `/var/www/design.solaripple.com/`

---

Add whatever helps you do your job. This is your cheat sheet.
