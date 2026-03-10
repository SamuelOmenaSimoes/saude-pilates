# Production: Database with Docker

When the app runs in Docker, **`localhost` in DATABASE_URL points to the container**, not the server. So the app cannot reach MySQL on the host unless you change the URL.

## 1. Use the host from the container

On the **server**, in the `.env` file used by Docker (e.g. `/var/www/saude-pilates-folder/.env` or `.../saude-pilates/.env`), set:

```env
# Use host.docker.internal so the container can reach MySQL on the server
DATABASE_URL=mysql://USER:PASSWORD@host.docker.internal:3306/DATABASE_NAME
```

Replace `USER`, `PASSWORD`, and `DATABASE_NAME` with your real values. Only the **host** must be `host.docker.internal` (not `localhost` or `127.0.0.1`).

## 2. Let MySQL accept connections from Docker

MySQL must listen on an address the container can reach and allow the app user from that network.

**Bind address** (e.g. `/etc/mysql/mysql.conf.d/mysqld.cnf` or `mysqld.cnf`):

```ini
# So the server accepts connections from Docker (and optionally others)
bind-address = 0.0.0.0
```

Then restart MySQL: `sudo systemctl restart mysql` (or `mariadb`).

**User permissions** – the app user must be allowed from the host/Docker network, not only `localhost`:

```sql
-- Example: allow from any host (use a strong password)
CREATE USER 'yourapp'@'%' IDENTIFIED BY 'your_password';
GRANT ALL ON your_database.* TO 'yourapp'@'%';
FLUSH PRIVILEGES;
```

If the user already exists only for `'localhost'`, add a second user for `'%'` or change the host:

```sql
CREATE USER 'yourapp'@'%' IDENTIFIED BY 'same_password';
GRANT ALL ON your_database.* TO 'yourapp'@'%';
FLUSH PRIVILEGES;
```

## 3. Check what the app is using

After deploy, check container logs. You should see either:

- `[Database] Connected to host.docker.internal:3306` → DB is reachable.
- `[Database] Failed to connect to host.docker.internal:3306 ...` → see the error (wrong host, MySQL not listening, user not allowed, etc.).

From the server you can also run:

```bash
# Env passed to the container (check DATABASE_URL host)
docker exec saude-pilates env | grep DATABASE

# Resolve host.docker.internal (should show an IP)
docker exec saude-pilates getent hosts host.docker.internal
```

## 4. If host.docker.internal is not available

On older Linux Docker, `host.docker.internal` might not exist. Then use the host’s IP or the Docker gateway IP in `DATABASE_URL` instead of `host.docker.internal` (e.g. the server’s private IP or `172.30.0.1` if that is the gateway for the app’s network).
