// src/components/visits/DoctorSelect.tsx
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import doctorService from "@/lib/doctorService";
import { Doctor } from "@/lib/doctorService";

interface DoctorSelectProps {
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}

export default function DoctorSelect({
  value,
  onChange,
  placeholder = "Select doctor...",
  className,
}: DoctorSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const params = {
          limit: 50,
          is_active: true,
          search: search.trim() || undefined,
        };
        const res = await doctorService.getDoctors(params);
        if (active) setDoctors(res.items ?? []);
      } catch (err) {
        console.error("Failed to load doctors:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDoctors();

    return () => { active = false; };
  }, [search]);

  const selectedDoctor = doctors.find((d) => String(d.id) === value);

  // Desired display format: "Dr. Muhammad Ali - Cardiology"
  const displayText = selectedDoctor
    ? `Dr. ${selectedDoctor.full_name}${selectedDoctor.specialization ? ` - ${selectedDoctor.specialization}` : ""}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{displayText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or specialization..."
            value={search}
            onValueChange={setSearch}
            className="h-9"
          />
          <CommandList className="max-h-72">
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                "No doctors found"
              )}
            </CommandEmpty>

            <CommandGroup>
              {doctors.map((doctor) => (
                <CommandItem
                  key={doctor.id}
                  value={String(doctor.id)}
                  onSelect={() => {
                    onChange(String(doctor.id));
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === String(doctor.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">Dr. {doctor.full_name}</span>
                    {doctor.specialization && (
                      <span className="text-xs text-muted-foreground">
                        {doctor.specialization}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}