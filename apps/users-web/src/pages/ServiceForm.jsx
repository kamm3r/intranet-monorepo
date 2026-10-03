import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import servicesApi from "../api/services";
import { useStore } from "../utils/store";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../components/ui/tooltip";
import { BadgeInfo, Eye, EyeOff, RefreshCw } from "lucide-react";

function HelpMe({ children }) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger type="button" aria-label="Näytä ohje">
                    <BadgeInfo className="w-4 h-4" />
                </TooltipTrigger>
                <TooltipContent align="start">
                    <p className="w-60">{children}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (
            c ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16),
    );
}

// A form page for adding and editing services.
export default function ServiceForm() {
    const { user, authReady, services, setServices } = useStore();
    const navigate = useNavigate();
    const { id } = useParams();

    const [name, setName] = useState("");
    const [domain, setDomain] = useState("");
    const [protocol, setProtocol] = useState("https");
    const [serviceKey, setServiceKey] = useState("");
    const [showKey, setShowKey] = useState(false);
    const editing = id !== "new" && id !== "add";
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!editing || !user?.admin || services.length) return;
        servicesApi.getAll().then(setServices).catch(() => setError("Palvelun tietoja ei voitu ladata."));
    }, [editing, user?.admin, services.length, setServices]);

    useEffect(() => {
        if (!editing) return;
        const service = services.find((item) => item._id === id);
        if (!service) return;
        setName(service.name ?? "");
        setDomain(service.domain ?? "");
        setProtocol(service.protocol ?? "https");
        setServiceKey(service.serviceKey ?? "");
    }, [editing, id, services]);


    if (!authReady) return <main className="p-4">Ladataan...</main>;

    if (!user || !user.admin) {
        return (
            <main className="flex flex-col grow justify-center items-center gap-2 px-4 pb-2 pt-4 sm:px-8 sm:py-4">
                <h2 className="text-3xl">
                    Vain järjestelmänvalvojilla on oikeus käyttää tätä sivua.
                </h2>
                <Link to="/" className="opacity-70 hover:opacity-100 hover:underline">
                    Takaisin etusivulle
                </Link>
            </main>
        );
    }

    const onSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        const serviceObject = {
            name,
            domain,
            protocol,
            serviceKey,
        };

        try {
            const returnedService = editing
                ? await servicesApi.update(id, serviceObject)
                : await servicesApi.create(serviceObject);
            setServices(editing
                ? services.map((service) => service._id === id ? returnedService : service)
                : [...services, returnedService]);
            navigate("/services");
        } catch {
            setError("Palvelua ei voitu tallentaa. Tarkista tiedot ja yritä uudelleen.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="w-full px-4 py-8 sm:px-6 sm:py-10">
            <Card className="mx-auto w-full min-w-0 max-w-xl">
                <CardHeader>
                <CardTitle>
                    {editing
                        ? "Muokkaa sovelluksen tietoja"
                        : "Lisää uusi sovellus intranetiin"}
                </CardTitle>
                <CardDescription>{editing ? "Muuta palvelun nimeä, osoitetta tai avainta." : "Liitä uusi sovellus intranetiin. Palvelun avaimen on vastattava sovelluksen asetuksia."}</CardDescription>
                </CardHeader>
                <CardContent>
                <form onSubmit={onSubmit} className="flex w-full min-w-0 flex-col gap-3 max-w-md">
                    <div className="flex w-full min-w-0 flex-col gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-1">
                            <Label htmlFor="name">Palvelun nimi</Label>
                            <HelpMe>
                                Anna lisättävälle sovellukselle nimi esim.
                                `kauppakassi-sovellus` pienillä kirjaimilla. Sovelukset ovat
                                portaaliin lisättäviä lisäominaisuuksia.{" "}
                            </HelpMe>
                        </div>
                        <Input
                            type="text"
                            id="name"
                            placeholder="kauppakassi-sovellus"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required
                            className="w-full min-w-0"
                        />
                    </div>
                    <div className="flex w-full min-w-0 flex-col gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-1">
                            <Label htmlFor="domain">Palvelun domain</Label>
                            <HelpMe>
                                Anna sovelluksen subdomain- tai domain-osoite esim.
                                `kuutio.intranet.com`, joka viitaa sovelluksen sijaintiin
                                palvelimella tai pilvipalvelussa.
                            </HelpMe>
                        </div>
                        <Input
                            type="text"
                            id="domain"
                            placeholder="kuutio.intranet.com"
                            value={domain}
                            onChange={(event) => setDomain(event.target.value)}
                            required
                            className="w-full min-w-0"
                        />
                    </div>
                    <div className="flex w-full min-w-0 flex-col gap-2 max-w-sm">
                        <div className="flex min-w-0 flex-wrap items-center gap-1">
                            <Label htmlFor="serviceKey">Palvelun avain</Label>
                            <HelpMe>
                                Luo yksilöllinen sovellusavain automaattisesti tai
                                käsin syöttämällä. Avainta voi muokata myöhemmin. Avain
                                syötetään sovelluksen ympäristömuuttujiin .env-tiedostoon.
                            </HelpMe>
                        </div>
                        <div className="flex w-full min-w-0 max-w-sm items-center gap-x-2">
                            <Input id="serviceKey" type={showKey ? "text" : "password"} value={serviceKey} onChange={(event) => setServiceKey(event.target.value)} className="w-full min-w-0" required />
                            <Button variant="ghost" type="button" onClick={() => setShowKey(!showKey)} aria-label={showKey ? "Piilota avain" : "Näytä avain"}>
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={() => setServiceKey(uuidv4())}
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span className="sr-only">Luo uusi avain</span>
                            </Button>
                        </div>
                    </div>
                    <RadioGroup value={protocol} onValueChange={setProtocol}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="https" id="r2" />
                            <Label htmlFor="r2">https</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="http" id="r1" />
                            <div className="flex items-center gap-1">
                                <Label htmlFor="r1">http</Label>
                                <HelpMe>käytä vain kehitysversiossa</HelpMe>
                            </div>
                        </div>
                    </RadioGroup>
                    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                    <div className="flex flex-wrap justify-end gap-2 pt-3">
                        <Button variant="outline" type="button" onClick={() => navigate("/services")}>Peruuta</Button>
                        <Button type="submit" disabled={saving}>{saving ? "Tallennetaan..." : "Tallenna palvelu"}</Button>
                    </div>
                </form>
                </CardContent>
            </Card>
        </main>
    );
}
