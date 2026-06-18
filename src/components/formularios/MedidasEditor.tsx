"use client";

import { Trash2, Plus } from "lucide-react";
import { Medida, MEDIDAS_ESTANDAR } from "@/lib/medidas";

interface Props {
  value: Medida[];
  onChange: (medidas: Medida[]) => void;
}

export default function MedidasEditor({ value, onChange }: Props) {
  // Asegurar que los campos estándar siempre estén presentes
  const standard = MEDIDAS_ESTANDAR.map(nombre => {
    const existing = value.find(m => m.nombre === nombre);
    return existing ?? { nombre, valor: "", unidad: "m" };
  });
  const custom = value.filter(m => !MEDIDAS_ESTANDAR.includes(m.nombre));
  const all = [...standard, ...custom];

  function update(index: number, field: keyof Medida, val: string) {
    const updated = all.map((m, i) => (i === index ? { ...m, [field]: val } : m));
    onChange(updated);
  }

  function addCustom() {
    onChange([...all, { nombre: "", valor: "", unidad: "m" }]);
  }

  function removeCustom(index: number) {
    const updated = all.filter((_, i) => i !== index);
    onChange(updated);
  }

  const INPUT_SM = "border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400";

  return (
    <div className="space-y-2">
      {/* Campos estándar */}
      <div className="grid grid-cols-1 gap-2">
        {standard.map((m, i) => (
          <div key={m.nombre} className="flex items-center gap-2">
            <span className="w-28 text-xs font-medium text-gray-600 shrink-0">{m.nombre}</span>
            <input
              type="text"
              value={m.valor}
              onChange={e => update(i, "valor", e.target.value)}
              placeholder="0.00"
              className={INPUT_SM + " flex-1"}
            />
            <select
              value={m.unidad}
              onChange={e => update(i, "unidad", e.target.value)}
              className={INPUT_SM + " w-16"}
            >
              <option value="m">m</option>
              <option value="cm">cm</option>
              <option value="mm">mm</option>
            </select>
          </div>
        ))}
      </div>

      {/* Campos personalizados */}
      {custom.length > 0 && (
        <div className="border-t border-gray-100 pt-2 space-y-2">
          {custom.map((m, ci) => {
            const globalIndex = standard.length + ci;
            return (
              <div key={globalIndex} className="flex items-center gap-2">
                <input
                  type="text"
                  value={m.nombre}
                  onChange={e => update(globalIndex, "nombre", e.target.value)}
                  placeholder="Nombre"
                  className={INPUT_SM + " w-28"}
                />
                <input
                  type="text"
                  value={m.valor}
                  onChange={e => update(globalIndex, "valor", e.target.value)}
                  placeholder="0.00"
                  className={INPUT_SM + " flex-1"}
                />
                <select
                  value={m.unidad}
                  onChange={e => update(globalIndex, "unidad", e.target.value)}
                  className={INPUT_SM + " w-16"}
                >
                  <option value="m">m</option>
                  <option value="cm">cm</option>
                  <option value="mm">mm</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeCustom(globalIndex)}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={addCustom}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
      >
        <Plus size={13} />
        Agregar medida personalizada
      </button>
    </div>
  );
}
