declare module 'react-speech-recognition' {
    export interface SpeechRecognitionOptions {
        continuous?: boolean
        language?: string
        interimResults?: boolean
    }

    export interface UseSpeechRecognitionOptions {
        transcription?: string
        clearTranscriptOnListen?: boolean
    }

    export interface SpeechRecognition {
        startListening(options?: SpeechRecognitionOptions): Promise<void>
        stopListening(): Promise<void>
        abortListening(): Promise<void>
        browserSupportsSpeechRecognition(): boolean
    }

    export function useSpeechRecognition(options?: UseSpeechRecognitionOptions): {
        transcript: string
        listening: boolean
        resetTranscript: () => void
        browserSupportsSpeechRecognition: boolean
        isMicrophoneAvailable: boolean
    }

    const SpeechRecognition: SpeechRecognition
    export default SpeechRecognition
}
