import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

/**
 * Interface cho cấu hình nhận diện giọng nói
 */
export interface SpeechRecognitionConfig {
    language?: string
    continuous?: boolean
    interimResults?: boolean
}

/**
 * Ngôn ngữ mặc định (Tiếng Việt)
 */
export const DEFAULT_SPEECH_LANGUAGE = 'vi-VN'

/**
 * Kiểm tra xem trình duyệt có hỗ trợ Web Speech API không
 */
export const checkSpeechRecognitionSupport = (): boolean => {
    return (
        typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    )
}

/**
 * Bắt đầu nhận diện giọng nói
 */
export const startListening = (config: SpeechRecognitionConfig = {}) => {
    const { language = DEFAULT_SPEECH_LANGUAGE, continuous = true } = config
    return SpeechRecognition.startListening({
        continuous,
        language,
    })
}

/**
 * Dừng nhận diện giọng nói
 */
export const stopListening = () => {
    return SpeechRecognition.stopListening()
}

/**
 * Hủy nhận diện giọng nói lập tức
 */
export const abortListening = () => {
    return SpeechRecognition.abortListening()
}

export { useSpeechRecognition, SpeechRecognition }
