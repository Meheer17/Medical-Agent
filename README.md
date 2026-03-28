# Navya

Mobile + backend triage and appointment scheduling app.

## 1) Backend setup (FastAPI)

Run these from the repository root.

1. Create and activate a virtual environment

   python3 -m venv .venv
   source .venv/bin/activate

2. Install backend dependencies

   pip install -r requirements.txt

3. Configure backend env in root .env

   The backend reads environment variables from .env at the repository root.

   Required keys:
   - DATABASE_URL
   - JWT_SECRET

   Common keys:
   - APP_NAME
   - ENVIRONMENT
   - DEBUG
   - JWT_ALGORITHM
   - ACCESS_TOKEN_EXPIRE_MINUTES
   - LLM_PROVIDER
   - OLLAMA_BASE_URL
   - OLLAMA_MODEL
   - GEMINI_MODEL
   - OPENAI_MODEL
   - GOOGLE_API_KEY
   - OPENAI_API_KEY
   - LLM_TIMEOUT_SECONDS

   Example:

   APP_NAME=Autonomous Triage Orchestrator
   ENVIRONMENT=dev
   DEBUG=true
   DATABASE_URL=mysql+pymysql://user:password@127.0.0.1:3306/navya
   JWT_SECRET=change-this-to-a-long-random-secret
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   LLM_PROVIDER=auto
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3
   GEMINI_MODEL=gemini-1.5-flash
   OPENAI_MODEL=gpt-4o-mini
   GOOGLE_API_KEY=
   OPENAI_API_KEY=
   LLM_TIMEOUT_SECONDS=60

4. Run backend with uvicorn

   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

API will be available at:
- http://127.0.0.1:8000
- Docs: http://127.0.0.1:8000/docs

## 2) Frontend setup (Expo app)

Run these from the app folder.

1. Install dependencies

   cd app
   npm install

2. Configure frontend env in app/.env

   EXPO_PUBLIC_API_BASE_URL=http://YOUR_BACKEND_IP:8000

   Notes:
   - Use your machine LAN IP when testing on a physical phone.
   - Android emulator typically uses http://10.0.2.2:8000.

3. Check API base URL source in app code

   Frontend API config lives in [app/lib/api.ts](app/lib/api.ts).

   If API_BASE_URL is hardcoded there, update it to your backend address or switch back to reading EXPO_PUBLIC_API_BASE_URL.

4. Start frontend

   npm run start

   Optional targets:
   - npm run android
   - npm run ios
   - npm run web

## 3) Typical local run order

1. Start backend first with uvicorn.
2. Start frontend in app folder.
3. Log in from the mobile app and test chat, booking, and doctor request flows.
