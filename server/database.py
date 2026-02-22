# server/database.py
import sqlite3
import time

class AsyncDatabase:
    def __init__(self, db_path="asyncshield.db"):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.cursor = self.conn.cursor()
        self._create_tables()

    def _create_tables(self):
        # NEW: Track Users
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                password TEXT,
                tokens INTEGER DEFAULT 0
            )
        ''')
        # NEW: Track GitHub-style Repositories
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS repos (
                id TEXT PRIMARY KEY,
                name TEXT,
                description TEXT,
                owner TEXT,
                version INTEGER,
                created_at REAL
            )
        ''')
        # UPDATED: Added repo_id
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS commits (
                id TEXT PRIMARY KEY,
                repo_id TEXT,
                client_id TEXT,
                status TEXT,
                reason TEXT,
                version_bump TEXT,
                bounty INTEGER,
                timestamp REAL
            )
        ''')
        self.conn.commit()

    def create_repo(self, repo_id, name, description, owner):
        self.cursor.execute('''
            INSERT INTO repos (id, name, description, owner, version, created_at)
            VALUES (?, ?, ?, ?, 1, ?)
        ''', (repo_id, name, description, owner, time.time()))
        self.conn.commit()

    def update_repo_version(self, repo_id, new_version):
        self.cursor.execute('UPDATE repos SET version = ? WHERE id = ?', (new_version, repo_id))
        self.conn.commit()

    def add_commit(self, repo_id, client_id, status, reason, version_bump, bounty):
        commit_id = f"commit-{int(time.time() * 1000)}"
        self.cursor.execute('''
            INSERT INTO commits (id, repo_id, client_id, status, reason, version_bump, bounty, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (commit_id, repo_id, client_id, status, reason, version_bump, bounty, time.time()))
        self.conn.commit()

    def get_all_repos(self):
        self.cursor.execute('SELECT id, name, description, owner, version FROM repos ORDER BY created_at DESC')
        return [{"id": r[0], "name": r[1], "description": r[2], "owner": r[3], "version": r[4]} for r in self.cursor.fetchall()]

    def get_repo_commits(self, repo_id):
        self.cursor.execute('SELECT client_id, status, reason, version_bump, bounty, timestamp FROM commits WHERE repo_id = ? ORDER BY timestamp DESC', (repo_id,))
        return [{"client": r[0], "status": r[1], "reason": r[2], "version_bump": r[3], "bounty": r[4]} for r in self.cursor.fetchall()]
    def create_user(self, username, password):
        try:
            self.cursor.execute('INSERT INTO users (username, password, tokens) VALUES (?, ?, 0)', (username, password))
            self.conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False

    def verify_user(self, username, password):
        self.cursor.execute('SELECT * FROM users WHERE username = ? AND password = ?', (username, password))
        return self.cursor.fetchone() is not None

    def get_user_tokens(self, username):
        self.cursor.execute('SELECT tokens FROM users WHERE username = ?', (username,))
        result = self.cursor.fetchone()
        return result[0] if result else 0

    def add_user_tokens(self, username, amount):
        self.cursor.execute('UPDATE users SET tokens = tokens + ? WHERE username = ?', (amount, username))
        self.conn.commit()
