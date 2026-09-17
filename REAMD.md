## How to `cryptp` 
- password via terminal
```bash
node -e "
const crypto = require('crypto');
const password = 'YOUR_PASSWORD_HERE';
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
console.log(salt + ':' + hash);
"
``` 

## Insert into db
```bash
INSERT INTO users (id, fullname, email, password, role, is_active, is_verified)
VALUES (
  1,
  'System Super Admin',
  'superadmin@eroxii.com',
  'YOUR_PASSWORD_AFTER_CRYPTP',
  1,
  1,
  1
)
ON DUPLICATE KEY UPDATE 
  password = VALUES(password),
  role = 1,
  is_active = 1,
  is_verified = 1;
```