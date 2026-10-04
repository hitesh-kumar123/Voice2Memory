import sys
import json
import os
import io

# Set OpenMP environment variable for Windows compatibility
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

def transcribe(audio_path: str, model_size: str = "base"):
    if not os.path.exists(audio_path):
        return {
            "success": False,
            "error": f"Audio file not found at: {audio_path}"
        }

    try:
        from faster_whisper import WhisperModel
        
        # Load Whisper model (uses local cache)
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        
        segments, info = model.transcribe(
            audio_path,
            beam_size=5,
            vad_filter=True, # Voice activity detection to filter silent portions
            vad_parameters=dict(min_silence_duration_ms=500)
        )
        
        segment_list = []
        full_text_parts = []
        
        for s in segments:
            text = s.text.strip()
            if text:
                full_text_parts.append(text)
                segment_list.append({
                    "start": round(s.start, 2),
                    "end": round(s.end, 2),
                    "text": text
                })
        
        full_transcript = " ".join(full_text_parts).strip()
        
        return {
            "success": True,
            "transcript": full_transcript,
            "language": info.language if hasattr(info, "language") else "en",
            "language_probability": round(info.language_probability, 2) if hasattr(info, "language_probability") else 1.0,
            "duration": round(info.duration, 2) if hasattr(info, "duration") else 0.0,
            "segments": segment_list
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Whisper transcription failed: {str(e)}"
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Missing audio file argument"}))
        sys.exit(1)
        
    audio_file = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 else "base"
    
    result = transcribe(audio_file, model_name)
    print(json.dumps(result))
