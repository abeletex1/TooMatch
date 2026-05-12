"use client";

import { ReactNode, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import { buttonClasses } from "@/components/ui/Button";
import { logoutAction } from "@/app/logout/actions";
import { createClient } from "@/lib/supabase/client";
import { saveProfileAction, type OnboardingPayload } from "./actions";
import { organizeTextAction, transcribeAndOrganizeAction } from "./ai-actions";

/* ===== Tipos y constantes ================================================ */

const TOTAL_STEPS = 6;

const VALUES_KEYS = [
  "valuesHonesty", "valuesHumor", "valuesCuriosity", "valuesEmpathy", "valuesLoyalty",
  "valuesAmbition", "valuesCalm", "valuesCreativity", "valuesIndependence", "valuesGenerosity",
  "valuesAdventure", "valuesNature", "valuesSport", "valuesTravel", "valuesNightlife",
  "valuesQuiet", "valuesFamily", "valuesPets", "valuesFood",
  "valuesProgressive", "valuesConservative", "valuesIndividualFreedom", "valuesSocialJustice",
  "valuesFeminism", "valuesSpirituality", "valuesScience", "valuesTradition", "valuesSustainability",
] as const;
type ValuesKey = typeof VALUES_KEYS[number];

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
  const t = useTranslations("onboarding");
  return (
    <div className="mb-4">
      <p className="text-[10px] uppercase tracking-[0.12em] text-ink-3 mb-2">
        {t("stepOf", { step, total: TOTAL_STEPS })}
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
  const tAi = useTranslations("onboarding");
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
      setAiError(tAi("aiMicError"));
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
          {recording ? tAi("aiStop") : tAi("aiRecord")}
        </button>

        {text.trim().length >= 10 && !recording && (
          <button
            type="button"
            onClick={handleOrganize}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] border-[0.5px] bg-bg border-border-strong text-ink-2 hover:bg-bg-2 disabled:opacity-40 transition-colors"
          >
            {loading ? tAi("aiProcessing") : tAi("aiImprove")}
          </button>
        )}

        {loading && (
          <span className="text-[11px] text-ink-3 font-light self-center">
            {recording ? "" : tAi("aiWriting")}
          </span>
        )}
      </div>

      {aiError && (
        <p className="text-[11px] text-rose-dark font-light mt-1.5">{aiError}</p>
      )}
    </div>
  );
}

/* ===== Wrong Intent Modal ================================================= */


/* ===== Step 1: ¿Quién eres? ============================================== */

function Step1({
  data,
  update,
}: {
  data: Data;
  update: (patch: Partial<Data>) => void;
}) {
  const t = useTranslations("onboarding");
  const [usedGuides, setUsedGuides] = useState<Set<number>>(new Set());
  const minChars = 150;
  const text = data.self_description;

  const guides = [t("step1Prompt1"), t("step1Prompt2"), t("step1Prompt3")];

  function appendGuide(idx: number, label: string) {
    const newText = text + (text ? "\n\n" : "") + `${label}: `;
    update({ self_description: newText });
    setUsedGuides(new Set(usedGuides).add(idx));
  }

  return (
    <>
      <StepHeader
        step={1}
        title={t("step1Title1")}
        titleEm={t("step1Title2")}
        subtitle={t("step1Subtitle")}
      />
      <AiHint>{t("step1Hint")}</AiHint>
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
        placeholder={t("step1Placeholder")}
        className="w-full h-[140px] resize-none border-[0.5px] border-border-strong rounded-xl px-3.5 py-3 text-[13px] font-light leading-[1.7] bg-bg text-ink outline-none focus:border-rose"
      />
      <p
        className={`text-[11px] text-right mt-1 ${
          text.length >= minChars ? "text-rose" : "text-ink-3"
        }`}
      >
        {text.length} / {t("step1Min")} {minChars}
      </p>
      {text.length > 0 && text.length < minChars && (
        <p className="text-[11px] text-rose-dark font-light mt-1">
          {t("step1TooShort", { min: minChars })}
        </p>
      )}
      <AiTextHelper text={text} onUpdate={(v) => update({ self_description: v })} field="self" />
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
  const t = useTranslations("onboarding");
  const [usedGuides, setUsedGuides] = useState<Set<number>>(new Set());
  const minChars = 150;
  const text = data.partner_description;

  const guides = [t("step2Prompt1"), t("step2Prompt2"), t("step2Prompt3"), t("step2Prompt4")];

  function appendGuide(idx: number, label: string) {
    const newText = text + (text ? "\n\n" : "") + `${label}: `;
    update({ partner_description: newText });
    setUsedGuides(new Set(usedGuides).add(idx));
  }

  return (
    <>
      <StepHeader
        step={2}
        title={t("step2Title1")}
        titleEm={t("step2Title2")}
        subtitle={t("step2Subtitle")}
      />
      <AiHint>{t("step2Hint")}</AiHint>
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
        placeholder={t("step2Placeholder")}
        className="w-full h-[140px] resize-none border-[0.5px] border-border-strong rounded-xl px-3.5 py-3 text-[13px] font-light leading-[1.7] bg-bg text-ink outline-none focus:border-rose"
      />
      <p
        className={`text-[11px] text-right mt-1 ${
          text.length >= minChars ? "text-rose" : "text-ink-3"
        }`}
      >
        {text.length} / {t("step1Min")} {minChars}
      </p>
      {text.length > 0 && text.length < minChars && (
        <p className="text-[11px] text-rose-dark font-light mt-1">
          {t("step1TooShort", { min: minChars })}
        </p>
      )}
      <AiTextHelper text={text} onUpdate={(v) => update({ partner_description: v })} field="partner" />

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
  const t = useTranslations("onboarding");
  const max = 5;

  const valueItems = VALUES_KEYS.map((key) => ({ key, label: t(key) }));

  function toggle(key: ValuesKey) {
    const isSelected = data.values.includes(key);
    if (isSelected) {
      update({ values: data.values.filter((v) => v !== key) });
    } else if (data.values.length < max) {
      update({ values: [...data.values, key] });
    }
  }

  return (
    <>
      <StepHeader
        step={3}
        title={t("step3Title1")}
        titleEm={t("step3Title2")}
        subtitle={t("step3Subtitle", { max })}
      />
      <div className="flex flex-wrap gap-1.5">
        {valueItems.map(({ key, label }) => {
          const sel = data.values.includes(key);
          const disabled = !sel && data.values.length >= max;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => toggle(key)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-light border-[0.5px] transition-colors ${
                sel
                  ? "bg-rose-light border-rose text-rose-dark"
                  : "bg-bg border-border-strong text-ink-2 hover:bg-bg-2"
              } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-ink-3 font-light text-right mt-3">
        {data.values.length} / {max} {t("step3Selected")}
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
  const t = useTranslations("onboarding");

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
        title={t("step4Title1")}
        titleEm={t("step4Title2")}
        subtitle={t("step4Subtitle")}
      />

      <p className="text-[12px] text-ink-2 mb-3">{t("step4LookingBetween")}</p>
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-[13px] text-ink-2 w-[40px] font-light">{t("step4Min")}</span>
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
        <span className="text-[13px] text-ink-2 w-[40px] font-light">{t("step4Max")}</span>
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
  const t = useTranslations("onboarding");
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
        title={t("step5Title1")}
        titleEm={t("step5Title2")}
        subtitle={t("step5Subtitle")}
      />

      <p className="text-[12px] text-ink-2 mb-2">{t("step5Province")}</p>
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
            {t("step5Change")}
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder={t("step5SearchProvince")}
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
              <p className="text-[12px] text-ink-3 px-3.5 py-3 font-light">{t("step5NoResults")}</p>
            )}
          </div>
        </>
      )}

      {data.province && (
        <>
          <p className="text-[12px] text-ink-2 mb-2">{t("step5City")}</p>
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
                {t("step5Change")}
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder={t("step5SearchCity")}
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
                  <p className="text-[12px] text-ink-3 px-3.5 py-3 font-light">{t("step5NoResults")}</p>
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
  const t = useTranslations("onboarding");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<number | null>(null);
  const [dragTarget, setDragTarget] = useState<number | null>(null);

  function getSlotAt(x: number, y: number): number | null {
    if (!gridRef.current) return null;
    const els = gridRef.current.querySelectorAll<HTMLElement>("[data-slot]");
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return Number(el.dataset.slot);
      }
    }
    return null;
  }

  function handleDragStart(e: React.PointerEvent<HTMLDivElement>, i: number) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragSource(i);
    setDragTarget(i);
  }

  function handleDragMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragSource === null) return;
    const slot = getSlotAt(e.clientX, e.clientY);
    if (slot !== null && slot !== dragTarget) setDragTarget(slot);
  }

  function handleDragEnd() {
    if (dragSource !== null && dragTarget !== null && dragSource !== dragTarget) {
      const newPhotos = [...data.photos];
      [newPhotos[dragSource], newPhotos[dragTarget]] = [newPhotos[dragTarget], newPhotos[dragSource]];
      update({ photos: newPhotos });
    }
    setDragSource(null);
    setDragTarget(null);
  }

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
        setUploadError(t("step6OnlyImages"));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(t("step6FileTooLarge", { filename: file.name }));
        return;
      }
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("step6NoSession"));

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
      const msg = err instanceof Error ? err.message : t("step6UploadError");
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
        title={t("step6Title1")}
        titleEm={t("step6Title2")}
        subtitle={t("step6Subtitle")}
      />
      <AiHint>{t("step6BlurNote", { count: 5 })}</AiHint>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {dragSource !== null && (
        <p className="text-[11px] text-rose font-light mb-2 text-center animate-fade-up">
          {t("step6SwapHint")}
        </p>
      )}
      <div
        ref={gridRef}
        className="grid grid-cols-3 gap-2 mb-3"
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        {data.photos.map((url, i) => (
          <div
            key={url}
            data-slot={i}
            onPointerDown={(e) => handleDragStart(e, i)}
            className={`aspect-square rounded-xl bg-bg-2 overflow-hidden relative touch-none select-none transition-all cursor-grab active:cursor-grabbing ${
              dragSource === i
                ? "opacity-40 scale-90"
                : dragTarget === i && dragSource !== null
                ? "ring-2 ring-rose scale-105"
                : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={t("step6PhotoLabel", { n: i + 1 })} className="w-full h-full object-cover pointer-events-none" />
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
              className="absolute top-1.5 right-1.5 w-[20px] h-[20px] rounded-full bg-ink/90 text-bg text-[12px] flex items-center justify-center hover:bg-ink"
              aria-label={t("step6Remove")}
            >
              ×
            </button>
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider bg-rose text-white">
                {t("step6MainLabel")}
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
              <span className="text-[11px] text-rose">{t("step6Uploading")}</span>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full bg-bg border-[0.5px] border-border-strong flex items-center justify-center text-ink-3 text-[16px]">
                  +
                </div>
                <span className="text-[9px] text-ink-3">
                  {data.photos.length === 0 ? t("step6AddPhotos") : t("step6AddMore")}
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
          {t("step6AddNote")}
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
  const tCommon = useTranslations("common");
  const tOnboarding = useTranslations("onboarding");
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
        return data.self_description.trim().length >= 150;
      case 2:
        return data.partner_description.trim().length >= 150;
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
      setError(tOnboarding("step6MissingData"));
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
      <Topbar back={step === 1 ? "/brand" : undefined} right={tCommon("day0")} />
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
            {tCommon("back")}
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
            ? tCommon("saving")
            : step === TOTAL_STEPS
            ? tCommon("finish")
            : tCommon("next")}
        </button>
      </div>

      <form action={logoutAction} className="text-center pb-3">
        <button
          type="submit"
          className="text-[11px] text-ink-3 font-light hover:text-rose-dark hover:underline underline-offset-2"
        >
          {tCommon("logout")}
        </button>
      </form>

    </MobileShell>
  );
}
