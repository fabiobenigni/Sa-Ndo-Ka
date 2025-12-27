# Guida al Deployment su NAS

## Requisiti
- Docker e Docker Compose installati sul NAS
- Accesso SSH o interfaccia web del NAS per caricare i file

## Passaggi per il Deployment

1. **Estrai l'archivio TAR**
   ```bash
   tar -xf sa-ndo-ka-deployment-*.tar
   cd sa-ndo-ka-deployment
   ```

2. **Configura le variabili d'ambiente**
   ```bash
   cp .env.example .env
   nano .env  # o usa il tuo editor preferito
   ```
   
   Modifica almeno:
   - `NEXTAUTH_SECRET`: genera una chiave segreta sicura
   - `NEXTAUTH_URL`: imposta l'URL del tuo NAS (es. `http://192.168.1.100` o `https://nas.tuodominio.com`)

3. **Crea le directory necessarie**
   ```bash
   mkdir -p data uploads nginx/ssl
   chmod 755 data uploads nginx/ssl
   ```

4. **Costruisci e avvia i container**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

5. **Verifica lo stato**
   ```bash
   docker-compose ps
   docker-compose logs -f app
   ```

6. **Accesso all'applicazione**
   - Apri il browser e vai all'URL configurato in `NEXTAUTH_URL`
   - La prima volta, registra un nuovo utente

## Configurazione HTTPS (Opzionale)

Per abilitare HTTPS con Let's Encrypt:

1. Configura `DOMAIN` e `CERTBOT_EMAIL` nel file `.env`
2. Avvia Certbot:
   ```bash
   docker-compose --profile ssl up certbot
   ```
3. Configura Nginx per HTTPS (vedi DOCKER.md per dettagli)

## Troubleshooting

- **Errore di permessi**: Assicurati che le directory `data` e `uploads` abbiano i permessi corretti
- **Database non inizializzato**: Il database viene creato automaticamente al primo avvio
- **Porta già in uso**: Modifica `HTTP_PORT` e `HTTPS_PORT` nel file `.env`

Per maggiori dettagli, consulta DOCKER.md
