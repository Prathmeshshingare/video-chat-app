class PeerProvider {
//   constructor() {
//     this.peer = new RTCPeerConnection({
//       iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//     });
//   }

//   async createOffer() {
//     const offer = await this.peer.createOffer();
//     await this.peer.setLocalDescription(offer);
//     return offer;
//   }

//   async createAnswer(offer) {
//     await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
//     const ans = await this.peer.createAnswer();
//     await this.peer.setLocalDescription(ans);
//     return ans;
//   }

//   async setAnswer(ans) {
//     await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
//   }
}

export default new PeerProvider();
