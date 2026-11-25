window.FerbCV = window.FerbCV || {};

window.FerbCV.LanyardClient = class LanyardClient {
  constructor(userId, onUpdate, onAvailability = () => {}) {
    this.userId = userId;
    this.onUpdate = onUpdate;
    this.onAvailability = onAvailability;
    this.ws = null;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.restEndpoint = `https://api.lanyard.rest/v1/users/${userId}`;
    this.wsEndpoint = "wss://api.lanyard.rest/socket";
  }

  async start() {
    await this.fetchInitialPresence();
    this.connectWebSocket();
  }

  async fetchInitialPresence() {
    try {
      const response = await fetch(this.restEndpoint);
      if (!response.ok) {
        this.onAvailability(false);
        return;
      }
      const payload = await response.json();
      if (payload && payload.success && payload.data) {
        this.onAvailability(true);
        this.onUpdate(payload.data);
      }
    } catch (_) {
      this.onAvailability(false);
      // REST erişilemezse WebSocket INIT_STATE verisi devralır
    }
  }

  connectWebSocket() {
    clearTimeout(this.reconnectTimer);
    if (this.ws && this.ws.readyState < 2) {
      this.ws.close();
    }

    const socket = new WebSocket(this.wsEndpoint);
    this.ws = socket;

    socket.addEventListener("message", (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (_) {
        return;
      }

      if (msg.op === 1 && msg.d && msg.d.heartbeat_interval) {
        this.startHeartbeat(msg.d.heartbeat_interval);
        socket.send(
          JSON.stringify({
            op: 2,
            d: { subscribe_to_id: this.userId }
          })
        );
        this.reconnectAttempts = 0;
      }

      if (msg.op === 0 && (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE")) {
        if (msg.d) {
          this.onAvailability(true);
          this.onUpdate(msg.d);
        }
      }
    });

    socket.addEventListener("close", () => {
      if (this.ws !== socket) return;
      this.stopHeartbeat();
      this.onAvailability(false);
      const delay = Math.min(30000, 1500 * Math.pow(2, this.reconnectAttempts));
      this.reconnectAttempts += 1;
      this.reconnectTimer = setTimeout(() => this.connectWebSocket(), delay);
    });

    socket.addEventListener("error", () => {
      if (this.ws === socket) this.onAvailability(false);
    });
  }

  startHeartbeat(intervalMs) {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ op: 3 }));
      }
    }, intervalMs);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
};
