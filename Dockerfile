FROM node:24-slim

# Создаем пользователя (опционально)
RUN groupadd --gid 2000 app && useradd --uid 2000 --gid 2000 -m -s /bin/bash app

# Рабочая директория
WORKDIR /app

# Копируем package.json и lock-файл
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем весь код
COPY --chown=app:app . .

# Используем пользователя app
USER app

# Порт, который слушает Timeweb
EXPOSE 5000

# Запуск сервера
CMD ["npm", "start"]
