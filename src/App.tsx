import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, CheckCircle2, AlertCircle, Loader2, MessageSquare, ShieldCheck } from 'lucide-react';

interface WhatsAppStatus {
  status: 'connecting' | 'open' | 'close' | 'qr';
  qr: string | null;
  error: string | null;
  user?: { id: string; name?: string };
}

export default function App() {
  const [status, setStatus] = useState<WhatsAppStatus>({
    status: 'connecting',
    qr: null,
    error: null
  });
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/whatsapp/status');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch WhatsApp status:', error);
      }
    };

    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleTestPing = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/whatsapp/test-ping', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        alert('Test ping sent to your own WhatsApp number!');
      } else {
        alert('Failed to send test ping: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error sending test ping: ' + (error as Error).message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#25D366] selection:text-black">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#25D366]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#25D366]/5 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[#25D366]">
              <ShieldCheck className="w-6 h-6" />
              <span className="text-xs font-mono tracking-[0.2em] uppercase font-bold">Nexus-Alpha Protocol</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-none">
              WHATSAPP<br />
              <span className="text-[#25D366]">SECURED.</span>
            </h1>
            <p className="text-gray-400 max-w-md text-lg leading-relaxed">
              Your autonomous WhatsApp agent is ready to deploy. Scan the encrypted QR code to establish a secure link.
            </p>
          </div>

          {/* Status Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* QR Section */}
            <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden group">
              <AnimatePresence mode="wait">
                {status.status === 'qr' && status.qr ? (
                  <motion.div
                    key="qr"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative z-10 flex flex-col items-center gap-6"
                  >
                    <div className="bg-white p-4 rounded-2xl shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                      <img src={status.qr} alt="WhatsApp QR Code" className="w-64 h-64" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="font-mono text-xs uppercase tracking-widest text-gray-500">Scan to Connect</p>
                      <p className="text-sm text-gray-400">Open WhatsApp on your phone and scan</p>
                    </div>
                  </motion.div>
                ) : status.status === 'open' ? (
                  <motion.div
                    key="connected"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-6 text-[#25D366]"
                  >
                    <div className="w-24 h-24 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold text-white">System Online</h3>
                      <p className="text-gray-400">Connection established and secured.</p>
                      <button 
                        onClick={handleTestPing}
                        disabled={isTesting}
                        className="mt-4 px-6 py-2 bg-[#25D366] text-black font-bold rounded-full hover:bg-[#1da851] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                      >
                        {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                        Send Test Ping
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 text-gray-500"
                  >
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="font-mono text-xs uppercase tracking-widest">Initializing Socket...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Info Section */}
            <div className="space-y-6">
              <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-[#25D366]" />
                  Active Logic
                </h3>
                <div className="space-y-3">
                  {[
                    { cmd: 'ping', status: 'Active' },
                    { cmd: '!help', status: 'Active' },
                    { cmd: '!status', status: 'Active' },
                    { cmd: '!echo', status: 'Active' }
                  ].map((item) => (
                    <div key={item.cmd} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-sm text-gray-400 font-mono">{item.cmd}</span>
                      <span className="text-xs font-bold text-[#25D366] uppercase tracking-wider">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#141414] border border-white/5 rounded-3xl p-8 space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-[#25D366]" />
                  System Logs
                </h3>
                <div className="font-mono text-[10px] space-y-2 text-gray-500 max-h-32 overflow-y-auto custom-scrollbar">
                  <p>[{new Date().toLocaleTimeString()}] BOOT_SEQUENCE: INITIALIZED</p>
                  <p>[{new Date().toLocaleTimeString()}] AUTH_STATE: {status.status.toUpperCase()}</p>
                  {status.error && (
                    <p className="text-red-500">[{new Date().toLocaleTimeString()}] ERROR: {status.error}</p>
                  )}
                  {status.status === 'open' && (
                    <p className="text-[#25D366]">[{new Date().toLocaleTimeString()}] CONNECTION: SECURED</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
