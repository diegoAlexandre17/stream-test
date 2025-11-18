import { useEffect } from "react";
import {
  StreamTheme,
  CallControls,
  SpeakerLayout,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

export default function CallInterface({ activeCall, setActiveCall, setIsCallActive }) {
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();

  const handleEndCall = async () => {
    if (activeCall) {
      await activeCall.leave();
      setActiveCall(null);
      setIsCallActive(false);
    }
  };

  // Si la llamada termina (LEFT), regresar al chat
  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      // Pequeño delay para que el usuario vea que la llamada terminó
      const timeout = setTimeout(() => {
        setActiveCall(null);
        setIsCallActive(false);
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [callingState, setActiveCall, setIsCallActive]);

  if (callingState !== CallingState.JOINED) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        zIndex: 1000,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "20px" }}>📞</div>
          <div>
            {callingState === CallingState.LEFT ? "Llamada finalizada..." : "Conectando a la llamada..."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <StreamTheme>
      <SpeakerLayout participantsBarPosition='bottom' />
      <CallControls onLeave={handleEndCall} />
    </StreamTheme>
  );
}
