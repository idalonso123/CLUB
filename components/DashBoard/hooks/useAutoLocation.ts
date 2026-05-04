import { useState, useRef } from "react";

interface UseAutoLocationProps {
  postalCode: string;
  country: string;
  setCity: (city: string) => void;
  setProvince?: (province: string) => void;
  setError?: (msg: string) => void;
}

export function useAutoLocation({ postalCode, country, setCity, setProvince, setError }: UseAutoLocationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Formato simple: puedes expandirlo según tus necesidades
  const getExpectedPostalCodeLength = (country: string): number => {
    if (country === "ES") return 5;
    if (country === "PT") return 7;
    if (country === "GB") return 6;
    return 5;
  };

  const isPostalCodeComplete = (postalCode: string, country: string): boolean => {
    const expectedLength = getExpectedPostalCodeLength(country);
    const cleanPostalCode = postalCode.replace(/[\s-]/g, "");
    if (country === "GB") return cleanPostalCode.length >= 5;
    return cleanPostalCode.length === expectedLength;
  };

  const handlePostalCodeChange = (value: string) => {
    if (setError) setError("");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!country) return;
    if (!value) {
      setCity("");
      return;
    }
    if (isPostalCodeComplete(value, country)) {
      timeoutRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/location/postalcode?code=${value}&country=${country}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data && result.data.city) {
              setCity(result.data.city);
              if (setProvince && result.data.state) {
                setProvince(result.data.state);
              }
            } else {
              setCity("");
              if (setProvince) setProvince("");
              if (setError) setError("No se encontró información para el código postal proporcionado.");
            }
          } else {
            setCity("");
            if (setProvince) setProvince("");
            if (setError) setError("Error al buscar información por código postal.");
          }
        } catch {
          setCity("");
          if (setProvince) setProvince("");
          if (setError) setError("Error al buscar información por código postal.");
        } finally {
          setIsLoading(false);
        }
      }, 500);
    } else {
      setCity("");
      if (setProvince) setProvince("");
    }
  };

  return { isLoading, handlePostalCodeChange };
}
