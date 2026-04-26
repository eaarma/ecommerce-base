"use client";

import { countryDialCodes } from "@/utils/countryDialCodes";
import { useState } from "react";

interface Props {
  value?: string;
  onChange: (phone: string) => void;
}

export default function PhoneInput({ value, onChange }: Props) {
  const getInitialParts = () => {
    const match = value
      ? countryDialCodes.find((c) => value.startsWith(c.dial_code))
      : undefined;

    if (match) {
      return {
        countryCode: match.dial_code.replace("+", ""),
        phoneNumber: value?.replace(match.dial_code, "") ?? "",
      };
    }

    return {
      countryCode: countryDialCodes[0]?.dial_code.replace("+", "") ?? "",
      phoneNumber: "",
    };
  };

  const [initialParts] = useState(getInitialParts);
  const [countryCode, setCountryCode] = useState(initialParts.countryCode);
  const [phoneNumber, setPhoneNumber] = useState(initialParts.phoneNumber);

  const emitPhone = (nextCountryCode: string, nextPhoneNumber: string) => {
    onChange(nextPhoneNumber ? `+${nextCountryCode}${nextPhoneNumber}` : "");
  };

  const handleCountryCodeChange = (nextCountryCode: string) => {
    setCountryCode(nextCountryCode);
    emitPhone(nextCountryCode, phoneNumber);
  };

  const handlePhoneNumberChange = (nextPhoneNumber: string) => {
    setPhoneNumber(nextPhoneNumber);
    emitPhone(countryCode, nextPhoneNumber);
  };

  return (
    <div className="flex gap-2">
      <select
        className="select select-bordered w-40"
        value={countryCode}
        onChange={(e) => handleCountryCodeChange(e.target.value)}
      >
        {countryDialCodes.map((c) => (
          <option key={c.code} value={c.dial_code.replace("+", "")}>
            {c.name} ({c.dial_code})
          </option>
        ))}
      </select>

      <input
        type="tel"
        className="input input-bordered flex-1"
        value={phoneNumber}
        onChange={(e) => handlePhoneNumberChange(e.target.value)}
        placeholder="Phone number"
      />
    </div>
  );
}
