"use client";

import { ReactNode, useRef, useState, useTransition } from "react";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import { buttonClasses } from "@/components/ui/Button";
import { logoutAction } from "@/app/logout/actions";
import { createClient } from "@/lib/supabase/client";
import { saveProfileAction, type OnboardingPayload } from "./actions";
import { organizeTextAction, transcribeAndOrganizeAction } from "./ai-actions";

/* ===== Tipos y constantes ================================================ */

const TOTAL_STEPS = 6;

const VALUES_OPTIONS = [
  "Honestidad",
  "Humor",
  "Curiosidad",
  "Empatía",
  "Aventura",
  "Calma",
  "Ambición",
  "Lealtad",
  "Creatividad",
  "Familia",
  "Cultura",
  "Deporte",
  "Naturaleza",
  "Espiritualidad",
];

type Data = {
  self_description: string;
  partner_description: string;
  values: string[];
  gender: "male" | "female" | "other" | null;
  seeking: "male" | "female" | "both" | null;
  age: number;
  age_min: number;
  age_max: number;
  province: string;
  city: string;
  photos: string[];
};

const PROVINCE_CITIES: Record<string, string[]> = {
  "Álava": ["Vitoria-Gasteiz", "Llodio", "Amurrio", "Salvatierra", "Laguardia"],
  "Albacete": ["Albacete", "Hellín", "Almansa", "Villarrobledo", "La Roda", "Caudete"],
  "Alicante": ["Alicante", "Elche", "Torrevieja", "Orihuela", "Benidorm", "Alcoy", "Elda", "Denia", "Villena", "Petrer", "Santa Pola"],
  "Almería": ["Almería", "Roquetas de Mar", "El Ejido", "Níjar", "Vícar", "Adra", "Berja", "Carboneras"],
  "Asturias": ["Oviedo", "Gijón", "Avilés", "Siero", "Langreo", "Mieres", "Castrillón", "Llanes", "Cangas de Onís"],
  "Ávila": ["Ávila", "Arenas de San Pedro", "Arévalo", "Sotillo de la Adrada", "Piedralaves"],
  "Badajoz": ["Badajoz", "Mérida", "Don Benito", "Villanueva de la Serena", "Almendralejo", "Zafra", "Montijo"],
  "Barcelona": ["Barcelona", "L'Hospitalet de Llobregat", "Badalona", "Terrassa", "Sabadell", "Mataró", "Cornellà de Llobregat", "Sant Cugat del Vallès", "Rubí", "Castelldefels", "Granollers", "Manresa", "Vic", "Igualada", "Vilanova i la Geltrú"],
  "Burgos": ["Burgos", "Miranda de Ebro", "Aranda de Duero", "Medina de Pomar", "Briviesca"],
  "Cáceres": ["Cáceres", "Plasencia", "Miajadas", "Navalmoral de la Mata", "Trujillo", "Moraleja"],
  "Cádiz": ["Cádiz", "Jerez de la Frontera", "Algeciras", "La Línea de la Concepción", "San Fernando", "El Puerto de Santa María", "Chiclana de la Frontera", "Sanlúcar de Barrameda", "Rota", "Tarifa"],
  "Cantabria": ["Santander", "Torrelavega", "Camargo", "Castro-Urdiales", "Piélagos", "El Astillero", "Laredo", "Santoña"],
  "Castellón": ["Castellón de la Plana", "Vila-real", "Benicarló", "Vinaròs", "Onda", "Benicàssim", "Nules", "Almassora"],
  "Ceuta": ["Ceuta"],
  "Ciudad Real": ["Ciudad Real", "Puertollano", "Tomelloso", "Alcázar de San Juan", "Valdepeñas", "Manzanares", "Daimiel"],
  "Córdoba": ["Córdoba", "Lucena", "Cabra", "Puente Genil", "Priego de Córdoba", "Montilla", "Peñarroya-Pueblonuevo", "Palma del Río"],
  "Cuenca": ["Cuenca", "Tarancón", "Motilla del Palancar", "San Clemente", "Quintanar del Rey"],
  "Girona": ["Girona", "Figueres", "Blanes", "Lloret de Mar", "Salt", "Olot", "Roses", "Palamós", "Palafrugell"],
  "Granada": ["Granada", "Motril", "Almuñécar", "Loja", "Baza", "Armilla", "Maracena", "Albolote", "Guadix", "Pulianas"],
  "Guadalajara": ["Guadalajara", "Azuqueca de Henares", "Cabanillas del Campo", "Alovera", "Molina de Aragón"],
  "Guipúzcoa": ["Donostia-San Sebastián", "Irun", "Errenteria", "Zarautz", "Eibar", "Arrasate-Mondragón", "Hernani", "Tolosa"],
  "Huelva": ["Huelva", "Lepe", "Almonte", "Cartaya", "Ayamonte", "Moguer", "Isla Cristina", "Palos de la Frontera"],
  "Huesca": ["Huesca", "Monzón", "Barbastro", "Sabiñánigo", "Fraga", "Jaca"],
  "Islas Baleares": ["Palma", "Ibiza", "Manacor", "Calvià", "Llucmajor", "Mahón", "Ciutadella de Menorca", "Marratxí", "Inca"],
  "Jaén": ["Jaén", "Linares", "Úbeda", "Baeza", "Andújar", "Martos", "Alcalá la Real", "Jodar"],
  "La Coruña": ["A Coruña", "Ferrol", "Santiago de Compostela", "Narón", "Oleiros", "Arteixo", "Betanzos", "Carballo", "Boiro"],
  "La Rioja": ["Logroño", "Calahorra", "Arnedo", "Haro", "Lardero", "Nájera"],
  "Las Palmas": ["Las Palmas de Gran Canaria", "Telde", "Santa Lucía de Tirajana", "San Bartolomé de Tirajana", "Arucas", "Gáldar", "Ingenio"],
  "León": ["León", "Ponferrada", "San Andrés del Rabanedo", "Astorga", "La Bañeza", "Villaquilambre"],
  "Lleida": ["Lleida", "Balaguer", "Tàrrega", "Mollerussa", "Cervera", "La Seu d'Urgell"],
  "Lugo": ["Lugo", "Monforte de Lemos", "Sarria", "Vilalba", "Viveiro", "Burela"],
  "Madrid": ["Madrid", "Móstoles", "Alcalá de Henares", "Fuenlabrada", "Leganés", "Getafe", "Alcorcón", "Torrejón de Ardoz", "Parla", "Alcobendas", "Rivas-Vaciamadrid", "Las Rozas de Madrid", "Pozuelo de Alarcón", "Majadahonda", "Boadilla del Monte", "Collado Villalba", "Arganda del Rey", "Aranjuez", "Valdemoro", "Tres Cantos", "San Sebastián de los Reyes", "Coslada"],
  "Málaga": ["Málaga", "Marbella", "Vélez-Málaga", "Fuengirola", "Torremolinos", "Mijas", "Estepona", "Benalmádena", "Nerja", "Ronda", "Antequera", "Alhaurín el Grande", "Coín"],
  "Melilla": ["Melilla"],
  "Murcia": ["Murcia", "Cartagena", "Lorca", "Molina de Segura", "Alcantarilla", "Mazarrón", "San Javier", "Águilas", "Torre-Pacheco", "Yecla", "Cieza"],
  "Navarra": ["Pamplona", "Tudela", "Barañain", "Burlada", "Estella-Lizarra", "Tafalla", "Sarriguren", "Berriozar"],
  "Ourense": ["Ourense", "Verín", "O Barco de Valdeorras", "Xinzo de Limia", "O Carballiño"],
  "Palencia": ["Palencia", "Guardo", "Aguilar de Campoo", "Venta de Baños"],
  "Pontevedra": ["Vigo", "Pontevedra", "Vilagarcía de Arousa", "Redondela", "Marín", "Cangas", "Moaña", "Sanxenxo", "O Porriño"],
  "Salamanca": ["Salamanca", "Béjar", "Ciudad Rodrigo", "Santa Marta de Tormes", "Carbajosa de la Sagrada"],
  "Santa Cruz de Tenerife": ["Santa Cruz de Tenerife", "La Laguna", "Arona", "Adeje", "Puerto de la Cruz", "Los Realejos", "La Orotava", "Güímar", "Granadilla de Abona"],
  "Segovia": ["Segovia", "Cuéllar", "El Espinar", "La Granja de San Ildefonso"],
  "Sevilla": ["Sevilla", "Dos Hermanas", "Alcalá de Guadaíra", "Utrera", "La Rinconada", "Mairena del Aljarafe", "Écija", "Camas", "Bormujos", "Carmona", "Morón de la Frontera"],
  "Soria": ["Soria", "Almazán", "El Burgo de Osma", "Ágreda"],
  "Tarragona": ["Tarragona", "Reus", "Tortosa", "Salou", "Cambrils", "El Vendrell", "Calafell", "Valls"],
  "Teruel": ["Teruel", "Alcañiz", "Andorra", "Utrillas", "Calamocha"],
  "Toledo": ["Toledo", "Talavera de la Reina", "Illescas", "Seseña", "Torrijos", "Consuegra", "Ocaña", "Madridejos"],
  "Valencia": ["Valencia", "Torrent", "Gandía", "Paterna", "Sagunto", "Alzira", "Burjassot", "Mislata", "Manises", "Ontinyent", "Xàtiva", "Cullera", "Sueca", "Requena"],
  "Valladolid": ["Valladolid", "Medina del Campo", "Laguna de Duero", "Arroyo de la Encomienda", "Tordesillas"],
  "Vizcaya": ["Bilbao", "Barakaldo", "Getxo", "Basauri", "Leioa", "Sestao", "Galdakao", "Erandio", "Durango", "Amorebieta"],
  "Zamora": ["Zamora", "Benavente", "Toro", "Puebla de Sanabria"],
  "Zaragoza": ["Zaragoza", "Calatayud", "Ejea de los Caballeros", "Tarazona", "Utebo", "Cuarte de Huerva"],
};

const PROVINCES = Object.keys(PROVINCE_CITIES).sort((a, b) =>
  a.localeCompare(b, "es")
);


/* ===== Helpers presentacionales =========================================== */

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = (current / total) * 100;
  return (
    <div className="px-7 pt-4">
      <div className="h-[2px] bg-bg-3 rounded-full overflow-hidden">
        <div
          className="h-full bg-rose rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StepHeader({
  step,
  title,
  titleEm,
  subtitle,
}: {
  step: number;
  title: string;
  titleEm?: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4">
      <p className="text-[10px] uppercase tracking-[0.12em] text-ink-3 mb-2">
        Paso {step} de {TOTAL_STEPS}
      </p>
      <h2 className="font-serif text-[26px] text-ink font-medium leading-[1.2] mb-2">
        {title}{" "}
        {titleEm ? (
          <em className="italic text-rose">{titleEm}</em>
        ) : null}
      </h2>
      <p className="text-[13px] text-ink-2 font-light leading-[1.65]">
        {subtitle}
      </p>
    </div>
  );
}

function AiHint({ children }: { children: ReactNode }) {
  return (
    <div className="bg-rose-light rounded-xl px-3.5 py-2.5 mb-4 flex items-start gap-2">
      <div className="w-[6px] h-[6px] rounded-full bg-rose shrink-0 mt-[6px]" />
      <p className="text-[12px] text-rose-dark font-light leading-[1.5]">
        {children}
      </p>
    </div>
  );
}

function GuideChip({
  num,
  label,
  used,
  onClick,
}: {
  num: number;
  label: string;
  used: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-2 border-[0.5px] transition-colors text-left ${
        used
          ? "border-rose-mid bg-rose-light"
          : "border-transparent hover:border-rose-mid hover:bg-rose-light"
      }`}
    >
      <span
        className={`w-[18px] h-[18px] rounded-full border-[0.5px] flex items-center justify-center text-[10px] font-medium shrink-0 ${
          used
            ? "bg-rose border-rose text-white"
            : "bg-rose-light border-rose-mid text-rose-dark"
        }`}
      >
        {num}
      </span>
      <span className="text-[12px] text-ink-2 font-light">{label}</span>
    </button>
  );
}

/* ===== AI Text Helper ==================================================== */

function AiTextHelper({
  text,
  onUpdate,
  field,
}: {
  text: string;
  onUpdate: (t: string) => void;
  field: "self" | "partner";
}) {
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function handleOrganize() {
    setAiError(null);
    setLoading(true);
    const res = await organizeTextAction(text, field);
    setLoading(false);
    if (res.error) setAiError(res.error);
    else if (res.text) onUpdate(res.text);
  }

  async function startRecording() {
    setAiError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("audio", blob, "recording.webm");
        setLoading(true);
        const res = await transcribeAndOrganizeAction(fd, field);
        setLoading(false);
        if (res.error) setAiError(res.error);
        else if (res.text) onUpdate(res.text);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setAiError("No se pudo acceder al micrófono.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="mt-2">
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] border-[0.5px] transition-colors disabled:opacity-40 ${
            recording
              ? "bg-rose text-white border-rose"
              : "bg-bg border-border-strong text-ink-2 hover:bg-bg-2"
          }`}
        >
          {recording ? "⏹ Parar grabación" : "🎙 Grabar"}
        </button>

        {text.trim().length >= 10 && !recording && (
          <button
            type="button"
            onClick={handleOrganize}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] border-[0.5px] bg-bg border-border-strong text-ink-2 hover:bg-bg-2 disabled:opacity-40 transition-colors"
          >
            {loading ? "Procesando…" : "✦ Mejorar con IA"}
          </button>
        )}

        {loading && (
          <span className="text-[11px] text-ink-3 font-light self-center">
            {recording ? "" : "La IA está redactando…"}
          </span>
        )}
      </div>

      {aiError && (
        <p className="text-[11px] text-rose-dark font-light mt-1.5">{aiError}</p>
      )}
    </div>
  );
}

/* ===== Step 1: ¿Quién eres? ============================================== */

function Step1({
  data,
  update,
}: {
  data: Data;
  update: (patch: Partial<Data>) => void;
}) {
  const [usedGuides, setUsedGuides] = useState<Set<number>>(new Set());
  const minChars = 30;
  const text = data.self_description;

  const guides = [
    "Cómo te describirían otras personas",
    "Cómo eres en tu día a día cuando estás a gusto",
    "Qué te hace sentir bien de verdad",
  ];

  function appendGuide(idx: number, label: string) {
    const newText = text + (text ? "\n\n" : "") + `${label}: `;
    update({ self_description: newText });
    setUsedGuides(new Set(usedGuides).add(idx));
  }

  return (
    <>
      <StepHeader
        step={1}
        title="¿Quién"
        titleEm="eres?"
        subtitle="Cuéntalo en tus palabras, sin filtros. Es lo único que verá tu match al principio."
      />
      <AiHint>
        No pienses en quedar bien. Cuanto más tú, mejor encaja.
      </AiHint>
      <div className="flex flex-col gap-1.5 mb-3">
        {guides.map((g, i) => (
          <GuideChip
            key={i}
            num={i + 1}
            label={g}
            used={usedGuides.has(i)}
            onClick={() => appendGuide(i, g)}
          />
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => update({ self_description: e.target.value })}
        placeholder="Por ejemplo: soy diseñador, vivo lento, me gusta la fotografía analógica…"
        className="w-full h-[140px] resize-none border-[0.5px] border-border-strong rounded-xl px-3.5 py-3 text-[13px] font-light leading-[1.7] bg-bg text-ink outline-none focus:border-rose"
      />
      <p
        className={`text-[11px] text-right mt-1 ${
          text.length >= minChars ? "text-rose" : "text-ink-3"
        }`}
      >
        {text.length} / mín. {minChars}
      </p>
      <AiTextHelper text={text} onUpdate={(t) => update({ self_description: t })} field="self" />
    </>
  );
}

/* ===== Step 2: ¿Qué buscas? ============================================== */

function Step2({
  data,
  update,
}: {
  data: Data;
  update: (patch: Partial<Data>) => void;
}) {
  const [usedGuides, setUsedGuides] = useState<Set<number>>(new Set());
  const minChars = 30;
  const text = data.partner_description;

  const guides = [
    "Cómo te gustaría que fuera esa persona en su día a día",
    "Qué tipo de vida te gustaría compartir",
    "Cómo te gustaría sentirte con esa persona",
    "Algo que sabes que no encajaría contigo",
  ];

  function appendGuide(idx: number, label: string) {
    const newText = text + (text ? "\n\n" : "") + `${label}: `;
    update({ partner_description: newText });
    setUsedGuides(new Set(usedGuides).add(idx));
  }

  return (
    <>
      <StepHeader
        step={2}
        title="¿Qué"
        titleEm="buscas?"
        subtitle="Personalidad, no perfil de LinkedIn. Cuéntanos cómo es esa persona."
      />
      <AiHint>
        Lo importante no es qué hace, sino cómo es.
      </AiHint>
      <div className="flex flex-col gap-1.5 mb-3">
        {guides.map((g, i) => (
          <GuideChip
            key={i}
            num={i + 1}
            label={g}
            used={usedGuides.has(i)}
            onClick={() => appendGuide(i, g)}
          />
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => update({ partner_description: e.target.value })}
        placeholder="Por ejemplo: alguien curioso, con sentido del humor, que me cuente cosas que no sé…"
        className="w-full h-[140px] resize-none border-[0.5px] border-border-strong rounded-xl px-3.5 py-3 text-[13px] font-light leading-[1.7] bg-bg text-ink outline-none focus:border-rose"
      />
      <p
        className={`text-[11px] text-right mt-1 ${
          text.length >= minChars ? "text-rose" : "text-ink-3"
        }`}
      >
        {text.length} / mín. {minChars}
      </p>
      <AiTextHelper text={text} onUpdate={(t) => update({ partner_description: t })} field="partner" />
    </>
  );
}

/* ===== Step 3: Valores =================================================== */

function Step3({
  data,
  update,
}: {
  data: Data;
  update: (patch: Partial<Data>) => void;
}) {
  const max = 4;

  function toggle(value: string) {
    const isSelected = data.values.includes(value);
    if (isSelected) {
      update({ values: data.values.filter((v) => v !== value) });
    } else if (data.values.length < max) {
      update({ values: [...data.values, value] });
    }
  }

  return (
    <>
      <StepHeader
        step={3}
        title="Tus"
        titleEm="valores"
        subtitle={`Elige hasta ${max}. Esto pesa mucho en la compatibilidad.`}
      />
      <div className="flex flex-wrap gap-1.5">
        {VALUES_OPTIONS.map((v) => {
          const sel = data.values.includes(v);
          const disabled = !sel && data.values.length >= max;
          return (
            <button
              key={v}
              type="button"
              disabled={disabled}
              onClick={() => toggle(v)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-light border-[0.5px] transition-colors ${
                sel
                  ? "bg-rose-light border-rose text-rose-dark"
                  : "bg-bg border-border-strong text-ink-2 hover:bg-bg-2"
              } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {v}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-ink-3 font-light text-right mt-3">
        {data.values.length} / {max} seleccionados
      </p>
    </>
  );
}

/* ===== Step 4: Rango de edad ============================================= */

function Step4({
  data,
  update,
}: {
  data: Data;
  update: (patch: Partial<Data>) => void;
}) {
  function updateRange(part: "min" | "max", value: number) {
    if (part === "min" && value < data.age_max - 1) {
      update({ age_min: value });
    } else if (part === "max" && value > data.age_min + 1) {
      update({ age_max: value });
    }
  }

  return (
    <>
      <StepHeader
        step={4}
        title="Rango de"
        titleEm="edad"
        subtitle="¿Entre qué edades buscas a tu match?"
      />

      <p className="text-[12px] text-ink-2 mb-3">Busco entre</p>
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-[13px] text-ink-2 w-[40px] font-light">Min</span>
        <input
          type="range"
          min={18}
          max={70}
          value={data.age_min}
          onChange={(e) => updateRange("min", Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-rose)" }}
        />
        <span className="text-[13px] font-medium text-ink w-[36px] text-right">
          {data.age_min}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="text-[13px] text-ink-2 w-[40px] font-light">Max</span>
        <input
          type="range"
          min={18}
          max={70}
          value={data.age_max}
          onChange={(e) => updateRange("max", Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-rose)" }}
        />
        <span className="text-[13px] font-medium text-ink w-[36px] text-right">
          {data.age_max}
        </span>
      </div>
    </>
  );
}

/* ===== Step 5: Ubicación ================================================= */

function Step5({
  data,
  update,
}: {
  data: Data;
  update: (patch: Partial<Data>) => void;
}) {
  const [provinceSearch, setProvinceSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const filteredProvinces = provinceSearch.trim()
    ? PROVINCES.filter((p) => p.toLowerCase().includes(provinceSearch.toLowerCase()))
    : PROVINCES;

  const cities = data.province ? (PROVINCE_CITIES[data.province] ?? []) : [];
  const filteredCities = citySearch.trim()
    ? cities.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase()))
    : cities;

  function selectProvince(p: string) {
    update({ province: p, city: "" });
    setProvinceSearch("");
    setCitySearch("");
  }

  return (
    <>
      <StepHeader
        step={5}
        title="¿Dónde"
        titleEm="estás?"
        subtitle="Tu provincia y ciudad. Así encontramos matches cerca de ti."
      />

      {/* Provincia */}
      <p className="text-[12px] text-ink-2 mb-2">Provincia</p>
      {data.province ? (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] bg-rose-light border-[0.5px] border-rose-mid text-rose-dark px-3 py-1 rounded-full font-light">
            {data.province}
          </span>
          <button
            type="button"
            onClick={() => update({ province: "", city: "" })}
            className="text-[11px] text-ink-3 hover:text-rose-dark"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Buscar provincia…"
            value={provinceSearch}
            onChange={(e) => setProvinceSearch(e.target.value)}
            className="w-full border-[0.5px] border-border-strong rounded-xl px-3.5 py-2.5 text-[13px] font-light bg-bg text-ink outline-none focus:border-rose mb-1.5"
          />
          <div className="max-h-[160px] overflow-y-auto flex flex-col rounded-xl border-[0.5px] border-border bg-bg mb-4">
            {filteredProvinces.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => selectProvince(p)}
                className="text-left px-3.5 py-2 text-[13px] font-light text-ink-2 hover:bg-bg-2 transition-colors"
              >
                {p}
              </button>
            ))}
            {filteredProvinces.length === 0 && (
              <p className="text-[12px] text-ink-3 px-3.5 py-3 font-light">Sin resultados.</p>
            )}
          </div>
        </>
      )}

      {/* Ciudad — solo aparece tras elegir provincia */}
      {data.province && (
        <>
          <p className="text-[12px] text-ink-2 mb-2">Ciudad</p>
          {data.city ? (
            <div className="flex items-center gap-2">
              <span className="text-[12px] bg-rose-light border-[0.5px] border-rose-mid text-rose-dark px-3 py-1 rounded-full font-light">
                {data.city}
              </span>
              <button
                type="button"
                onClick={() => update({ city: "" })}
                className="text-[11px] text-ink-3 hover:text-rose-dark"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Buscar ciudad…"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="w-full border-[0.5px] border-border-strong rounded-xl px-3.5 py-2.5 text-[13px] font-light bg-bg text-ink outline-none focus:border-rose mb-1.5"
              />
              <div className="max-h-[160px] overflow-y-auto flex flex-col rounded-xl border-[0.5px] border-border bg-bg">
                {filteredCities.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { update({ city: c }); setCitySearch(""); }}
                    className="text-left px-3.5 py-2 text-[13px] font-light text-ink-2 hover:bg-bg-2 transition-colors"
                  >
                    {c}
                  </button>
                ))}
                {filteredCities.length === 0 && (
                  <p className="text-[12px] text-ink-3 px-3.5 py-3 font-light">Sin resultados.</p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

/* ===== Step 6: Fotos (subida real con Supabase Storage) ================== */

const MAX_PHOTOS = 6;

function Step6({
  data,
  update,
}: {
  data: Data;
  update: (patch: Partial<Data>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function openPicker() {
    setUploadError(null);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    const available = MAX_PHOTOS - data.photos.length;
    const toUpload = files.slice(0, available);

    for (const file of toUpload) {
      if (!file.type.startsWith("image/")) {
        setUploadError("Solo se aceptan imágenes.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`"${file.name}" pesa más de 10 MB.`);
        return;
      }
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sin sesión.");

      const uploaded: string[] = [];
      for (const file of toUpload) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("profile-photos")
          .upload(path, file, { upsert: true });
        if (upErr) throw upErr;

        const { data: { publicUrl } } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(path);
        uploaded.push(publicUrl);
      }

      update({ photos: [...data.photos, ...uploaded] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al subir";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(slot: number) {
    const compacted = data.photos.filter((_, i) => i !== slot);
    update({ photos: compacted });
  }

  return (
    <>
      <StepHeader
        step={6}
        title="Tus"
        titleEm="fotos"
        subtitle="Hasta 6 fotos. La primera será tu foto principal."
      />
      <AiHint>
        Tus fotos quedan <strong>bloqueadas</strong> para tu match hasta que
        intercambiéis 5 mensajes. Nadie las ve antes.
      </AiHint>

      {/* Input oculto — acepta múltiples archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-3 gap-2 mb-3">
        {data.photos.map((url, i) => (
          <div
            key={url}
            className="aspect-square rounded-xl bg-bg-2 overflow-hidden relative"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-1.5 right-1.5 w-[20px] h-[20px] rounded-full bg-ink/90 text-bg text-[12px] flex items-center justify-center hover:bg-ink"
              aria-label="Quitar foto"
            >
              ×
            </button>
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider bg-rose text-white">
                Principal
              </span>
            )}
          </div>
        ))}

        {data.photos.length < MAX_PHOTOS && (
          <button
            type="button"
            disabled={uploading}
            onClick={openPicker}
            className="aspect-square rounded-xl border-[0.5px] border-dashed border-border-strong bg-bg-2 flex flex-col items-center justify-center gap-1 hover:bg-bg-3 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <span className="text-[11px] text-rose">Subiendo…</span>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full bg-bg border-[0.5px] border-border-strong flex items-center justify-center text-ink-3 text-[16px]">
                  +
                </div>
                <span className="text-[9px] text-ink-3">
                  {data.photos.length === 0 ? "Añadir fotos" : "Añadir más"}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {uploadError ? (
        <p className="text-[11px] text-rose-dark font-light text-center">
          {uploadError}
        </p>
      ) : (
        <p className="text-[11px] text-ink-3 text-center font-light">
          Puedes seleccionar varias fotos a la vez. Puedes terminar sin fotos y añadirlas después.
        </p>
      )}
    </>
  );
}

/* ===== Componente principal ============================================== */

export default function OnboardingFlow({
  initialGender,
  initialSeeking,
  initialAge,
}: {
  initialGender: "male" | "female" | "other" | null;
  initialSeeking: "male" | "female" | "both" | null;
  initialAge: number;
}) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Data>({
    self_description: "",
    partner_description: "",
    values: [],
    gender: initialGender,
    seeking: initialSeeking,
    age: initialAge,
    age_min: 22,
    age_max: 38,
    province: "",
    city: "",
    photos: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update(patch: Partial<Data>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  function canProceed(): boolean {
    switch (step) {
      case 1:
        return data.self_description.trim().length >= 30;
      case 2:
        return data.partner_description.trim().length >= 30;
      case 3:
        return data.values.length >= 1;
      case 4:
        return data.age_min < data.age_max;
      case 5:
        return data.province !== "" && data.city.trim() !== "";
      case 6:
        return true; // fotos opcionales por ahora
      default:
        return true;
    }
  }

  function handleNext() {
    setError(null);
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    // Último paso → guardar
    if (
      data.gender === null ||
      data.seeking === null
    ) {
      setError("Faltan datos obligatorios.");
      return;
    }
    const payload: OnboardingPayload = {
      ...data,
      gender: data.gender,
      seeking: data.seeking,
    };
    startTransition(async () => {
      const res = await saveProfileAction(payload);
      if (res?.error) setError(res.error);
    });
  }

  function handleBack() {
    setError(null);
    if (step > 1) setStep(step - 1);
  }

  return (
    <MobileShell>
      <Topbar back={step === 1 ? "/brand" : undefined} right="Día 0" />
      <ProgressBar current={step} total={TOTAL_STEPS} />

      <div
        key={step}
        className="animate-fade-up flex flex-1 flex-col px-7 pt-6 pb-3 overflow-y-auto"
      >
        {step === 1 && <Step1 data={data} update={update} />}
        {step === 2 && <Step2 data={data} update={update} />}
        {step === 3 && <Step3 data={data} update={update} />}
        {step === 4 && <Step4 data={data} update={update} />}
        {step === 5 && <Step5 data={data} update={update} />}
        {step === 6 && <Step6 data={data} update={update} />}

        {error ? (
          <p className="text-[12px] text-rose-dark font-light mt-3">
            {error}
          </p>
        ) : null}
      </div>

      {/* Nav buttons */}
      <div className="flex gap-2.5 px-7 pt-2 pb-3 border-t-[0.5px] border-border bg-bg">
        {step > 1 ? (
          <button
            onClick={handleBack}
            disabled={pending}
            className={`${buttonClasses("outline")} flex-1`}
          >
            ← Atrás
          </button>
        ) : null}
        <button
          onClick={handleNext}
          disabled={!canProceed() || pending}
          className={`${buttonClasses(
            step === TOTAL_STEPS ? "rose" : "ink"
          )} flex-1`}
        >
          {pending
            ? "Guardando…"
            : step === TOTAL_STEPS
            ? "Terminar →"
            : "Siguiente →"}
        </button>
      </div>

      {/* Logout sutil */}
      <form action={logoutAction} className="text-center pb-3">
        <button
          type="submit"
          className="text-[11px] text-ink-3 font-light hover:text-rose-dark hover:underline underline-offset-2"
        >
          Cerrar sesión
        </button>
      </form>
    </MobileShell>
  );
}
