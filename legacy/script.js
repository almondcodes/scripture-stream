const OBS_URL = "ws://localhost:4455"; // Change to remote IP if needed
const OBS_PASSWORD = "laL2j8s2E7Sfnj7x";
const OBS_SOURCE_NAME = "Bible Verse";

let obsSocket;
let connected = false;

async function hashSHA256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const base64 = btoa(String.fromCharCode(...hashArray));
  return base64;
}


async function connectOBS() {
  return new Promise((resolve, reject) => {
    obsSocket = new WebSocket(OBS_URL);

    obsSocket.onopen = () => {
      console.log("WebSocket opened");
    };

    obsSocket.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      if (msg.op === 0) {
        const challenge = msg.d.authentication.challenge;
        const salt = msg.d.authentication.salt;
        const secret = await hashSHA256(OBS_PASSWORD + salt);
        const auth = await hashSHA256(secret + challenge);

        console.log("Challenge:", challenge);
        console.log("Salt:", salt);
        console.log("Auth (calculated):", auth);

        obsSocket.send(JSON.stringify({
          op: 1,
          d: { rpcVersion: 1, authentication: auth }
        }));
      }

      if (msg.op === 2) {
        connected = true;
        document.getElementById("status").textContent = "✅ Connected to OBS";
        resolve();
      }
    };

    obsSocket.onerror = () => {
      document.getElementById("status").textContent = "❌ Error connecting to OBS";
      reject();
    };

    obsSocket.onclose = () => {
    connected = false;
    document.getElementById("status").textContent = "🔌 OBS connection closed";

    // Try to reconnect after a few seconds
    setTimeout(() => {
      connectOBS().catch(() => {
        document.getElementById("status").textContent = "⚠️ Waiting to reconnect to OBS...";
      });
    }, 5000);
  };

  });
}


async function sendVerse() {
  const ref = document.getElementById("verseRef").value;
  const status = document.getElementById("status");
  const preview = document.getElementById("previewText");

  status.textContent = "🔍 Fetching verse...";
  preview.textContent = "Loading...";

  const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}`);
  const data = await res.json();

  if (!data.text) {
    status.textContent = "❌ Verse not found!";
    preview.textContent = "None";
    return;
  }

  const verseText = `${data.reference}: ${data.text.trim()}`;
  preview.textContent = verseText;

  if (!connected) {
    try {
      await connectOBS();
    } catch {
      status.textContent = "❌ Cannot connect to OBS";
      return;
    }
  }

  const payload = {
    op: 6,
    d: {
      requestType: "SetInputSettings",
      requestId: "setVerse",
      requestData: {
        inputName: OBS_SOURCE_NAME,
        inputSettings: { text: verseText }
      }
    }
  };

  obsSocket.send(JSON.stringify(payload));
  status.textContent = "✅ Verse sent to OBS!";
}

// Auto-connect when page loads
connectOBS().catch(() => {
  document.getElementById("status").textContent = "⚠️ Waiting for OBS...";
});
