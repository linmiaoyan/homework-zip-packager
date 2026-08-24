#!/usr/bin/env python3
"""作业压缩包收集工具 — Flask Web 服务。"""

from __future__ import annotations

import io
import os
import socket
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, render_template, request, send_file
from zipfile import ZIP_DEFLATED, ZipFile

from deploy import deploy_all, get_game_by_slug, package_downloads, read_deploy_meta, write_deploy_meta
from game_packager import attach_windows_exe
from intro_notes import (
    clear_intro_override,
    get_intro_for_game,
    list_admin_items,
    set_intro_override,
    get_intro_override,
)
from naming import build_archive_name, preview_filename, sanitize_filename_part
from comments import add_comment, list_comments
from ratings import add_rating, list_ratings, summarize_ratings

BASE_DIR = Path(__file__).resolve().parent
COLLECT_DIR = BASE_DIR / "收集"
DEPLOY_DIR = BASE_DIR / "deployed"
RATINGS_FILE = BASE_DIR / "data" / "ratings.json"
COMMENTS_FILE = BASE_DIR / "data" / "comments.json"
INTROS_FILE = BASE_DIR / "data" / "intros.json"
ADMIN_PASSWORD = "202501"
COLLECT_DIR.mkdir(exist_ok=True)
DEPLOY_DIR.mkdir(exist_ok=True)
RATINGS_FILE.parent.mkdir(exist_ok=True)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 512 * 1024 * 1024  # 512 MB


def get_local_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"


def get_server_port() -> int:
    return int(os.environ.get("PORT", 5050))


def is_admin_request() -> bool:
    password = request.headers.get("X-Admin-Password") or ""
    if not password and request.is_json:
        password = (request.get_json(silent=True) or {}).get("password", "")
    return password == ADMIN_PASSWORD


def enrich_games(games: list[dict]) -> list[dict]:
    for game in games:
        slug = game.get("slug")
        if slug:
            game["ratings"] = summarize_ratings(RATINGS_FILE, slug)
        # 简介：优先用管理员覆盖，其次用 deploy meta 中的 description
        override = get_intro_override(slug, INTROS_FILE) if slug else ""
        if override:
            game["intro"] = {"description": override, "source": "admin"}
        elif game.get("description"):
            game["intro"] = {"description": game["description"], "source": "zip"}
        else:
            game["intro"] = {"description": "", "source": "none"}
    return games


def validate_submission(leader: str, work: str, file_count: int) -> str | None:
    preview = preview_filename(leader, work)
    if not preview["complete"]:
        return "请完整填写组长姓名和作品名称。"
    if file_count == 0:
        return "请先选择要上传的项目文件夹。"
    return None


def create_zip_from_uploads(files, leader: str, work: str, description: str) -> tuple[bytes, str]:
    leader_clean = sanitize_filename_part(leader)
    work_clean = sanitize_filename_part(work)
    archive_name = f"{build_archive_name(leader_clean, work_clean)}.zip"

    from intro_notes import build_game_meta

    buffer = io.BytesIO()
    with ZipFile(buffer, "w", ZIP_DEFLATED) as zf:
        # 写入用户文件
        for uploaded in files:
            if not uploaded or not uploaded.filename:
                continue
            arcname = uploaded.filename.replace("\\", "/")
            zf.writestr(arcname, uploaded.read())
        # 嵌入项目元数据（简介）
        if description.strip():
            import json
            meta = build_game_meta(leader_clean, work_clean, description)
            zf.writestr(".game-meta.json", json.dumps(meta, ensure_ascii=False, indent=2))

    buffer.seek(0)
    return buffer.getvalue(), archive_name


@app.get("/")
def index():
    port = get_server_port()
    return render_template(
        "index.html",
        server_ip=get_local_ip(),
        server_port=port,
        server_url=f"http://{get_local_ip()}:{port}",
    )


@app.get("/gallery")
def gallery():
    return render_template("gallery.html")


@app.get("/play/<slug>")
def play(slug: str):
    game = get_game_by_slug(slug, COLLECT_DIR, DEPLOY_DIR)
    if not game or game.get("status") != "ready":
        return render_template("play.html", game=None, slug=slug), 404
    summary = summarize_ratings(RATINGS_FILE, slug)
    intro = get_intro_for_game(game, INTROS_FILE)
    downloads = {}
    if game.get("runtime") == "pygame":
        downloads = package_downloads(game)
    elif game.get("runtime") == "exe":
        downloads = {
            "downloads": [
                {
                    "type": "exe-file",
                    "label": "下载 EXE 文件",
                }
            ],
            "has_windows_exe": True,
        }
    return render_template(
        "play.html",
        game=game,
        slug=slug,
        summary=summary,
        intro=intro,
        downloads=downloads,
    )


@app.post("/api/preview")
def api_preview():
    data = request.get_json(silent=True) or {}
    result = preview_filename(
        data.get("leader", ""),
        data.get("work", ""),
    )
    return jsonify(result)


@app.post("/api/pack")
def api_pack():
    files = request.files.getlist("files")
    leader = request.form.get("leader", "")
    work = request.form.get("work", "")
    description = request.form.get("description", "")
    error = validate_submission(
        leader,
        work,
        len([f for f in files if f and f.filename]),
    )
    if error:
        return jsonify({"ok": False, "error": error}), 400

    try:
        zip_bytes, archive_name = create_zip_from_uploads(files, leader, work, description)
    except Exception as exc:
        return jsonify({"ok": False, "error": f"打包失败：{exc}"}), 500

    out_path = COLLECT_DIR / archive_name
    out_path.write_bytes(zip_bytes)

    auto = request.form.get("auto") == "1"
    if auto:
        return jsonify(
            {
                "ok": True,
                "filename": archive_name,
                "size": len(zip_bytes),
                "modified": datetime.fromtimestamp(out_path.stat().st_mtime).strftime(
                    "%Y-%m-%d %H:%M:%S"
                ),
            }
        )

    return send_file(
        io.BytesIO(zip_bytes),
        mimetype="application/zip",
        as_attachment=True,
        download_name=archive_name,
    )


@app.get("/api/collect/download/<path:filename>")
def api_collect_download(filename: str):
    safe_name = Path(filename).name
    if safe_name != filename or not safe_name.endswith(".zip"):
        return jsonify({"ok": False, "error": "无效的文件名。"}), 400

    out_path = COLLECT_DIR / safe_name
    if not out_path.is_file():
        return jsonify({"ok": False, "error": "文件不存在。"}), 404

    return send_file(out_path, mimetype="application/zip", as_attachment=True, download_name=safe_name)


@app.get("/api/games")
def api_games():
    games = deploy_all(COLLECT_DIR, DEPLOY_DIR)
    return jsonify({"items": enrich_games(games), "count": len(games)})


@app.post("/api/admin/login")
def api_admin_login():
    data = request.get_json(silent=True) or {}
    if str(data.get("password", "")) != ADMIN_PASSWORD:
        return jsonify({"ok": False, "error": "密码错误。"}), 401
    return jsonify({"ok": True})


@app.get("/api/admin/intros")
def api_admin_intros():
    if not is_admin_request():
        return jsonify({"ok": False, "error": "未授权。"}), 401
    games = deploy_all(COLLECT_DIR, DEPLOY_DIR)
    items = list_admin_items(games, INTROS_FILE)
    by_slug = {g.get("slug"): g for g in games if g.get("slug")}
    for item in items:
        game = by_slug.get(item.get("slug"), {})
        item["runtime"] = game.get("runtime")
        item["has_windows_exe"] = game.get("has_windows_exe", False)
    return jsonify({"ok": True, "items": items})


@app.put("/api/admin/intros/<slug>")
def api_admin_intro_update(slug: str):
    if not is_admin_request():
        return jsonify({"ok": False, "error": "未授权。"}), 401
    data = request.get_json(silent=True) or {}
    description = str(data.get("description", "")).strip()
    set_intro_override(
        INTROS_FILE,
        slug,
        description,
        zip_name="",
    )
    return jsonify({"ok": True})


@app.delete("/api/admin/intros/<slug>")
def api_admin_intro_reset(slug: str):
    if not is_admin_request():
        return jsonify({"ok": False, "error": "未授权。"}), 401
    clear_intro_override(INTROS_FILE, slug)
    return jsonify({"ok": True})



@app.post("/api/admin/games/<slug>/upload-exe")
def api_admin_upload_exe(slug: str):
    if not is_admin_request():
        return jsonify({"ok": False, "error": "未授权。"}), 401

    game = get_game_by_slug(slug, COLLECT_DIR, DEPLOY_DIR)
    if not game or game.get("runtime") != "pygame":
        return jsonify({"ok": False, "error": "仅 Pygame 作品支持上传 exe。"}), 400

    upload = request.files.get("exe")
    if not upload or not upload.filename:
        return jsonify({"ok": False, "error": "请选择 .exe 文件。"}), 400
    if not upload.filename.lower().endswith(".exe"):
        return jsonify({"ok": False, "error": "请上传 .exe 文件。"}), 400

    deploy_root = DEPLOY_DIR / slug
    title = game.get("work") or game.get("title") or "game"
    pkg_update = attach_windows_exe(deploy_root, title, upload.read())

    meta = read_deploy_meta(deploy_root) or {}
    package = meta.get("package") or {}
    package.update(pkg_update)
    meta["package"] = package
    write_deploy_meta(deploy_root, meta)

    return jsonify({"ok": True, "package": package, "downloads": package_downloads(meta)})


@app.get("/api/games/<slug>/ratings")
def api_game_ratings(slug: str):
    game = get_game_by_slug(slug, COLLECT_DIR, DEPLOY_DIR)
    if not game:
        return jsonify({"ok": False, "error": "游戏不存在。"}), 404
    return jsonify(
        {
            "ok": True,
            "items": list_ratings(RATINGS_FILE, slug),
            "summary": summarize_ratings(RATINGS_FILE, slug),
        }
    )


@app.post("/api/games/<slug>/ratings")
def api_game_rate(slug: str):
    game = get_game_by_slug(slug, COLLECT_DIR, DEPLOY_DIR)
    if not game or game.get("status") != "ready":
        return jsonify({"ok": False, "error": "游戏不存在或未部署。"}), 404

    data = request.get_json(silent=True) or {}
    nickname = str(data.get("nickname", ""))
    try:
        score = int(data.get("score", ""))
    except (TypeError, ValueError):
        return jsonify({"ok": False, "error": "请填写有效分数。"}), 400

    try:
        entry = add_rating(RATINGS_FILE, slug, nickname, score)
    except ValueError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400

    return jsonify(
        {
            "ok": True,
            "rating": entry,
            "summary": summarize_ratings(RATINGS_FILE, slug),
        }
    )


@app.get("/api/games/<slug>/comments")
def api_game_comments(slug: str):
    game = get_game_by_slug(slug, COLLECT_DIR, DEPLOY_DIR)
    if not game:
        return jsonify({"ok": False, "error": "游戏不存在。"}), 404
    items = list_comments(COMMENTS_FILE, slug)
    return jsonify({"ok": True, "items": items, "count": len(items)})


@app.post("/api/games/<slug>/comments")
def api_game_comment(slug: str):
    game = get_game_by_slug(slug, COLLECT_DIR, DEPLOY_DIR)
    if not game or game.get("status") != "ready":
        return jsonify({"ok": False, "error": "游戏不存在或未部署。"}), 404

    data = request.get_json(silent=True) or {}
    nickname = str(data.get("nickname", ""))
    content = str(data.get("content", ""))

    try:
        entry = add_comment(COMMENTS_FILE, slug, content, nickname)
    except ValueError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400

    return jsonify({"ok": True, "comment": entry, "count": len(list_comments(COMMENTS_FILE, slug))})


def _send_package_file(slug: str, kind: str):
    game = get_game_by_slug(slug, COLLECT_DIR, DEPLOY_DIR)
    if not game or game.get("status") != "ready":
        return jsonify({"ok": False, "error": "游戏不存在。"}), 404

    package = game.get("package") or {}
    key_map = {
        "windows": "windows_exe",
        "mac": "mac_zip",
        "exe": "windows_exe",
        "source": "source_zip",
    }
    if kind == "exe" and not package.get("windows_exe"):
        key_map["exe"] = "mac_zip" if package.get("mac_zip") else "exe_zip"

    rel_path = package.get(key_map.get(kind, ""))
    if not rel_path:
        hint = "Windows exe 尚未生成。请在 Windows 电脑运行 build_windows.bat，或由管理员上传 exe。"
        return jsonify({"ok": False, "error": hint}), 404

    file_path = (DEPLOY_DIR / slug / rel_path).resolve()
    safe_root = (DEPLOY_DIR / slug).resolve()
    if not str(file_path).startswith(str(safe_root)) or not file_path.is_file():
        return jsonify({"ok": False, "error": "文件不存在。"}), 404

    return send_file(file_path, as_attachment=True, download_name=file_path.name)


@app.get("/api/games/<slug>/download/windows")
def api_download_windows(slug: str):
    return _send_package_file(slug, "windows")


@app.get("/api/games/<slug>/download/mac")
def api_download_mac(slug: str):
    return _send_package_file(slug, "mac")


@app.get("/api/games/<slug>/download/exe")
def api_download_exe(slug: str):
    return _send_package_file(slug, "exe")


@app.get("/api/games/<slug>/download/source")
def api_download_source(slug: str):
    return _send_package_file(slug, "source")


@app.get("/api/games/<slug>/download/exe-file")
def api_download_exe_file(slug: str):
    """直接下载 exe 文件（当 zip 里只有 exe 时使用）。"""
    game = get_game_by_slug(slug, COLLECT_DIR, DEPLOY_DIR)
    if not game or game.get("status") != "ready":
        return jsonify({"ok": False, "error": "游戏不存在。"}), 404
    if game.get("runtime") != "exe":
        return jsonify({"ok": False, "error": "该游戏不是 exe 类型。"}), 400

    deploy_root = DEPLOY_DIR / slug
    exe_path = deploy_root / game["entry_point"]
    if not exe_path.is_file():
        return jsonify({"ok": False, "error": "exe 文件不存在。"}), 404

    return send_file(exe_path.resolve(), as_attachment=True, download_name=exe_path.name)


@app.get("/games/<slug>/<path:asset_path>")
def serve_game(slug: str, asset_path: str):
    safe_root = (DEPLOY_DIR / slug).resolve()
    target = (safe_root / asset_path).resolve()
    if not str(target).startswith(str(safe_root)) or not target.is_file():
        return jsonify({"ok": False, "error": "资源不存在。"}), 404
    return send_file(target)


@app.get("/api/collect")
def api_collect():
    items = []
    for path in sorted(COLLECT_DIR.glob("*.zip"), key=lambda p: p.stat().st_mtime, reverse=True):
        stat = path.stat()
        items.append(
            {
                "name": path.name,
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
            }
        )
    return jsonify({"items": items, "count": len(items)})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    app.run(host="0.0.0.0", port=port, debug=True)
