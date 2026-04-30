import { useEffect, useRef } from "react";
import { apiCall, buildUrl } from "../utils/apiClient";

export default function useGlobalSosNotifier(currentPath = "") {
  const audioContextRef = useRef(null);
  const initializedRef = useRef(false);
  const seenAlertKeysRef = useRef(new Set());

  const createAudioContext = () => {
    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioContextRef.current = new Ctx();
    }
    return audioContextRef.current;
  };

  const unlockAudio = async () => {
    try {
      const context = createAudioContext();
      if (!context) return;
      if (context.state === "suspended") {
        await context.resume();
      }
    } catch (error) {
      console.error("Unable to unlock global SOS audio", error);
    }
  };

  const playAlertSound = async () => {
    try {
      const context = audioContextRef.current;
      if (!context) return;
      if (context.state === "suspended") {
        await context.resume();
      }
      if (context.state !== "running") return;

      const beep = (frequency, delay) => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.type = "square";
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0.25;
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.start(context.currentTime + delay);
        oscillator.stop(context.currentTime + delay + 0.18);
      };

      beep(1050, 0);
      beep(760, 0.22);
    } catch (error) {
      console.error("Unable to play global SOS alert sound", error);
    }
  };

  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudio();
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, []);

  useEffect(() => {
    let timer = null;

    const pollSos = async () => {
      const data = await apiCall(
        buildUrl(`get_sos.php?_ts=${Date.now()}`),
        {
          cache: "no-store",
          suppressStatusWarning: true
        }
      );

      if (!data?.status) return;

      const incoming = Array.isArray(data.alerts) ? data.alerts : [];
      const incomingKeys = incoming.map((item) => `${item.id ?? ""}|${item.created_at ?? ""}`);
      const onSosPage = String(currentPath || "").includes("/sos");
      const canPlaySound = audioContextRef.current?.state === "running";

      if (!initializedRef.current) {
        if (!onSosPage && incomingKeys.length > 0 && canPlaySound) {
          playAlertSound();
        }
      } else {
        const hasNewAlert = incomingKeys.some((key) => !seenAlertKeysRef.current.has(key));
        if (!onSosPage && hasNewAlert && canPlaySound) {
          playAlertSound();
        }
      }

      seenAlertKeysRef.current = new Set(incomingKeys);
      initializedRef.current = true;
    };

    pollSos();
    timer = setInterval(pollSos, 5000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentPath]);
}
