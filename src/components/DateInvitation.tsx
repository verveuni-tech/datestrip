import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DateInvitation as InvitationType } from "../types";
import { Calendar, Clock, MapPin, Send, Copy, ArrowRight, Heart, Sparkles, CheckSquare, Plus, Check } from "lucide-react";

interface DateInvitationProps {
  onBack: () => void;
}

export default function DateInvitation({ onBack }: DateInvitationProps) {
  const [hostName, setHostName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("FaceTime");
  const [customLocation, setCustomLocation] = useState("");
  const [selectedActivities, setSelectedActivities] = useState<string[]>([
    "Take Photostrip Cuts",
    "Flip Question Cards",
  ]);
  const [note, setNote] = useState("");
  const [generatedInvite, setGeneratedInvite] = useState<InvitationType | null>(null);
  const [copied, setCopied] = useState(false);

  const activitiesList = [
    "Take Photostrip Cuts",
    "Flip Question Cards",
    "Draw Pixel Art together",
    "Watch a movie synchronously",
    "Lofi music session",
    "Order food for each other",
  ];

  const handleActivityToggle = (act: string) => {
    setSelectedActivities((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
    );
  };

  const handleGenerate = () => {
    if (hostName && partnerName && date && time) {
      setGeneratedInvite({
        hostName,
        partnerName,
        date,
        time,
        location: location === "custom" ? customLocation : location,
        activities: selectedActivities,
        note,
      });
    }
  };

  const getInviteText = () => {
    if (!generatedInvite) return "";
    return `Hey ${generatedInvite.partnerName}! 💖

${generatedInvite.hostName} is inviting you to a special LDR Virtual Date! Here are the details:

📅 Date: ${new Date(generatedInvite.date).toLocaleDateString(undefined, { dateStyle: "full" })}
⏰ Time: ${generatedInvite.time}
📍 Meeting Place: ${generatedInvite.location}

✨ What we are doing:
${generatedInvite.activities.map((act) => ` - ${act}`).join("\n")}

💌 Note: "${generatedInvite.note || "Can't wait to see you!"}"

Create your own date memories on DateStrip! See you there!`;
  };

  const handleCopyText = () => {
    const text = getInviteText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <span className="font-mono text-xs tracking-widest text-pink-500 bg-pink-50 dark:bg-pink-950/30 dark:text-pink-400 px-3 py-1 rounded-full font-bold uppercase">
          Virtual Invitations
        </span>
        <h2 className="font-display text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-3">
          Create a Date Night Ticket
        </h2>
        <p className="text-zinc-500 text-sm mt-1">
          Schedule a virtual date and craft a beautiful ticket invitation to send to your partner
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: THE BUILDER FORM - Span 6 */}
        <div className="lg:col-span-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm space-y-5">
          <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-zinc-100">
            Invite Details
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">
                YOUR NAME
              </label>
              <input
                type="text"
                placeholder="Mohit"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-sm outline-none focus:border-zinc-500 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">
                PARTNER NAME
              </label>
              <input
                type="text"
                placeholder="Khushi"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-sm outline-none focus:border-zinc-500 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">
                DATE
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-xs outline-none focus:border-zinc-500 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">
                TIME
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-xs outline-none focus:border-zinc-500 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">
              MEETING PLATFORM
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {["FaceTime", "Zoom", "Discord", "custom"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setLocation(p)}
                  className={`p-2.5 border rounded-xl text-xs font-medium cursor-pointer text-center capitalize transition-colors ${
                    location === p
                      ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-white border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {location === "custom" && (
              <input
                type="text"
                placeholder="Where are you meeting? e.g. Telepathy Room"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-sm outline-none mt-2 focus:border-zinc-500 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-zinc-400 mb-2">
              PLAN FOR THE DATE
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activitiesList.map((act) => {
                const isSelected = selectedActivities.includes(act);

                return (
                  <button
                    key={act}
                    type="button"
                    onClick={() => handleActivityToggle(act)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900"
                        : "bg-white border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <span className="shrink-0">
                      {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </span>
                    <span className="truncate">{act}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">
              SWEET NOTE
            </label>
            <textarea
              placeholder="Can't wait to see your smile..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-20 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-sm outline-none focus:border-zinc-500 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!hostName || !partnerName || !date || !time}
            className={`w-full py-3.5 rounded-xl font-display font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
              hostName && partnerName && date && time
                ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed shadow-none"
            }`}
          >
            <span>Generate Ticket Invitation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* RIGHT COLUMN: THE TICKET CARD PREVIEW - Span 6 */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center h-full">
          <AnimatePresence mode="wait">
            {generatedInvite ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-sm flex flex-col items-center"
              >
                {/* Vintage Ticket styled layout */}
                <div className="w-full bg-amber-50 text-amber-950 rounded-3xl shadow-2xl border-[3px] border-amber-900 p-6 flex flex-col justify-between relative overflow-hidden font-display">
                  
                  {/* Decorative ticket cutout holes on edges */}
                  <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-950 border-[3px] border-amber-900 z-10" />
                  <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-950 border-[3px] border-amber-900 z-10" />

                  {/* Top Bar with Stamp */}
                  <div className="flex justify-between items-start border-b-2 border-dashed border-amber-900/40 pb-4 mb-4">
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-amber-800/60 block">
                        Boarding Pass
                      </span>
                      <h4 className="font-black text-xl tracking-tight text-amber-950">
                        DATE NIGHT
                      </h4>
                    </div>
                    {/* Retro Stamp */}
                    <div className="w-12 h-12 border-2 border-amber-700/50 rounded flex flex-col items-center justify-center rotate-[12deg] text-amber-800 bg-amber-100/50">
                      <span className="text-[7px] uppercase font-mono tracking-widest">Love</span>
                      <Heart className="w-4 h-4 fill-amber-700 text-amber-700" />
                      <span className="text-[6px] font-mono">Approved</span>
                    </div>
                  </div>

                  {/* Body details */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 font-mono text-xs">
                      <div>
                        <span className="text-amber-800/60 block text-[9px]">HOST</span>
                        <span className="font-bold text-amber-950">{generatedInvite.hostName.toUpperCase()}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-800/40" />
                      <div className="text-right">
                        <span className="text-amber-800/60 block text-[9px]">PASSENGER</span>
                        <span className="font-bold text-amber-950">{generatedInvite.partnerName.toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-b border-amber-900/10 py-3">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-4 h-4 text-amber-800/75 shrink-0" />
                        <span className="font-mono text-[11px]">
                          {new Date(generatedInvite.date).toLocaleDateString(undefined, {
                            dateStyle: "medium",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="w-4 h-4 text-amber-800/75 shrink-0" />
                        <span className="font-mono text-[11px]">{generatedInvite.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <MapPin className="w-4 h-4 text-amber-800/75 shrink-0" />
                        <span className="font-mono text-[11px]">{generatedInvite.location}</span>
                      </div>
                    </div>

                    {/* What we are doing checklist */}
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-amber-800/60 block mb-1.5">
                        Flight Itinerary
                      </span>
                      <ul className="text-[11px] font-mono text-amber-900 space-y-1">
                        {generatedInvite.activities.map((act, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-700" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {note && (
                      <div className="p-3 bg-amber-100/50 rounded-xl border border-amber-900/10 italic text-xs text-amber-900">
                        "{note}"
                      </div>
                    )}
                  </div>

                  {/* Barcode bottom */}
                  <div className="mt-6 pt-4 border-t-2 border-dashed border-amber-900/40 flex flex-col items-center justify-center">
                    {/* Simulated vector barcode lines */}
                    <div className="flex gap-0.5 h-10 w-full justify-center bg-white/40 p-1 rounded">
                      {[1, 2, 4, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2].map((w, idx) => (
                        <div
                          key={idx}
                          className="bg-amber-950/80 rounded-sm"
                          style={{ width: `${w * 1.5}px` }}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-[8px] text-amber-800/60 mt-1 uppercase tracking-widest">
                      datestrip-token-{(hostName + partnerName).toLowerCase()}
                    </span>
                  </div>

                </div>

                {/* Invite Actions */}
                <div className="flex gap-3 w-full mt-6">
                  <button
                    onClick={handleCopyText}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-zinc-950 text-white font-display font-medium text-xs rounded-xl hover:bg-zinc-800 cursor-pointer shadow-md"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copied ? "✓ Copied!" : "Copy Whatsapp Text"}</span>
                  </button>
                  <button
                    onClick={() => alert("Souvenir ticket generated successfully! Save a screenshot to print.")}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border border-zinc-200 bg-white text-zinc-700 font-display font-medium text-xs rounded-xl hover:bg-zinc-50 cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-zinc-500" />
                    <span>Verify Pass</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="w-full max-w-sm aspect-[3/4] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-6 flex flex-col items-center justify-center text-center shadow-inner">
                <span className="text-4xl mb-4 animate-pulse">🎟️</span>
                <h4 className="font-display font-bold text-zinc-700 dark:text-zinc-300">
                  Ticket preview is empty
                </h4>
                <p className="text-zinc-400 text-xs mt-1.5 max-w-xs leading-relaxed font-mono">
                  Fill out the invite details on the left, then click Generate to create your customized boarding pass!
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex justify-center mt-12 border-t border-zinc-100 dark:border-zinc-800 pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600 font-display font-medium rounded-xl text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 transition-colors cursor-pointer"
        >
          ← Back to Landing
        </button>
      </div>
    </div>
  );
}
