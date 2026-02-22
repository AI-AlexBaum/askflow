# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email the maintainers with details of the vulnerability
3. Include steps to reproduce if possible
4. Allow time for a fix before public disclosure

## Security Best Practices

When deploying AskFlow in production:

### JWT Secret
```bash
# Generate a strong secret
openssl rand -hex 32
```
Set this as `JWT_SECRET` in your `.env` file. Never use the default value.

### HTTPS
Always use HTTPS in production. Use a reverse proxy (nginx, Caddy) with TLS certificates.

### CORS
Set `ALLOWED_ORIGINS` in `.env` to restrict API access to your domain:
```bash
ALLOWED_ORIGINS=https://yourdomain.com
```

### Database
- The SQLite database is stored at `DATABASE_PATH` (default: `./data/faq.db`)
- Ensure the database file is not publicly accessible
- Regular backups recommended (use the Export feature in admin panel)

### API Keys
- API keys are hashed before storage (SHA-256)
- Rotate keys periodically
- Revoke unused keys from the admin panel

### Docker
- Don't run containers as root in production
- Use Docker secrets for sensitive environment variables
- Keep the Docker image updated
