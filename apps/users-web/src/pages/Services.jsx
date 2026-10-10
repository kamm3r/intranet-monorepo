import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminOnly } from "../components/AdminOnly";
import { PageContainer, PageHeader, PageStatus } from "@intranet/ui/page";

import servicesApi from "../api/services";
import { useStore } from "../utils/store";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  EyeIcon,
  EyeOffIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

function MoreOptions({ service }) {
  const { services, setServices } = useStore();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="data-[state=open]:bg-muted"
          aria-label={`Toiminnot palvelulle ${service.name}`}
        >
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => navigate(`/services/${service._id}`)}>
          Muokkaa
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => setConfirmOpen(true)}>
          Poista
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Poistetaanko palvelu {service.name}?</AlertDialogTitle>
          <AlertDialogDescription>Palvelu poistetaan palveluluettelosta.</AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel>Peruuta</AlertDialogCancel>
          <AlertDialogAction onClick={async (event) => {
            event.preventDefault();
            try {
              await servicesApi.remove(service._id);
              setServices(services.filter((item) => item._id !== service._id));
              setConfirmOpen(false);
            } catch {
              setError("Palvelua ei voitu poistaa.");
            }
          }}>Poista</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

function CopyToClip({ service }) {
  const [copy, setCopy] = useState(false);
  const copyUrlToClipboard = (key) => {
    setCopy(true);
    navigator.clipboard.writeText(key);
    setTimeout(() => setCopy(false), 1000);
  };

  return <Button
    type="button"
    variant="link"
    size="sm"
    className="h-auto max-w-32 min-w-0 px-0 font-mono text-xs"
    aria-label="Kopioi palvelun avain"
    onClick={() => copyUrlToClipboard(service.serviceKey)}
  ><span className="truncate">{copy ? "Kopioitu" : service.showServiceKey ? service.serviceKey : "********"}</span></Button>;
}

function ServiceItems({ mobile = false }) {
  const services = useStore((state) => state.services);
  const setServices = useStore((state) => state.setServices);

  const showOrHideServiceKey = (service) => {
    setServices(services.map((item) => item._id === service._id
      ? { ...item, showServiceKey: !item.showServiceKey }
      : item));
  };
  if (!services || services.length === 0) {
    return mobile ? <p className="px-5 py-8 text-sm text-muted-foreground">Palveluita ei vielä ole. Lisää ensimmäinen palvelu yllä olevasta painikkeesta.</p> : (
      <TableRow>
        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Palveluita ei vielä ole. Lisää ensimmäinen palvelu yllä olevasta painikkeesta.</TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {services.map((service) => (
        mobile ? <div key={service._id} className="space-y-3 border-b px-5 py-4 last:border-b-0">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0"><p className="font-semibold">{service.name}</p><p className="break-all text-sm text-muted-foreground">{service.domain}</p></div>
            <MoreOptions service={service} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="outline">{service.protocol}</Badge>
            <div className="flex min-w-0 items-center gap-1"><CopyToClip service={service} /><Button type="button" variant="ghost" size="icon-sm" aria-label={service.showServiceKey ? "Piilota avain" : "Näytä avain"} onClick={() => showOrHideServiceKey(service)}>{service.showServiceKey ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}</Button></div>
          </div>
        </div> : <TableRow key={service._id}>
          <TableCell>{service.name}</TableCell>
          <TableCell>{service.protocol}</TableCell>
          <TableCell>{service.domain}</TableCell>
          <TableCell className="overflow-hidden">
            <CopyToClip service={service} />
          </TableCell>
          <TableCell>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={service.showServiceKey ? "Piilota avain" : "Näytä avain"}
              onClick={() => showOrHideServiceKey(service)}
            >
              {service.showServiceKey ? (
                <EyeOffIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </Button>
          </TableCell>
          <TableCell>
            <MoreOptions service={service} />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function Services() {
  const { user, authReady, setServices } = useStore();
  const services = useStore((state) => state.services);
  const [loadError, setLoadError] = useState("");

  const navigate = useNavigate();

  const getServices = async () => {
    if (user && user.admin) {
      try {
        let serviceEntries = await servicesApi.getAll();

        serviceEntries.forEach((s) => (s.showServiceKey = false));

        setServices(serviceEntries);
      } catch (exception) {
        setLoadError("Palveluita ei voitu ladata. Päivitä sivu ja yritä uudelleen.");
      }
    }
  };

  useEffect(() => {
    getServices();
  }, [user]);

  if (!authReady) return <PageStatus />

    if (!user || !user.admin) return <AdminOnly />

  return (
    <PageContainer>
        <PageHeader title="Palvelut" description="Hallinnoi intranetiin liitettyjä sovelluksia ja niiden yhteystietoja." actions={<Button onClick={() => navigate("/services/new")}><PlusIcon className="size-4" />Lisää palvelu</Button>} />
        {loadError && <p role="alert" className="mb-4 text-sm text-destructive">{loadError}</p>}
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex-row items-center justify-between gap-3 border-b">
            <div>
              <CardTitle className="text-lg">Palveluluettelo</CardTitle>
              <CardDescription>Palvelun avain näkyy vain ylläpitäjälle.</CardDescription>
            </div>
            <Badge variant="secondary">{services.length}</Badge>
          </CardHeader>
          <CardContent className="p-0">
        <div className="md:hidden"><ServiceItems mobile /></div>
        <div className="hidden w-full overflow-x-auto md:block">
        <Table className="min-w-[640px]">
          <TableCaption className="sr-only">Intranetin palvelut</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-56">Nimi</TableHead>
              <TableHead className="w-20">Protokolla</TableHead>
              <TableHead className="w-56">Domain</TableHead>
              <TableHead className="w-40">Avain</TableHead>
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-[100px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <ServiceItems />
          </TableBody>
        </Table>
        </div>
          </CardContent>
        </Card>
    </PageContainer>
  );
}
