import { useState, useEffect, useCallback } from 'react'
import servicesApi from '../api/services'
import usersApi from '../api/users'
import { useStore } from '../utils/store'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '../components/ui/dropdown-menu'
import { Button } from '../components/ui/button'
import { MoreHorizontalIcon, Plus, Trash2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select"
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../components/ui/alert-dialog'

const accessLevels = [
    { role: 'Käyttäjä', accessLevel: 1 },
    { role: 'Sisällön muokkaaja', accessLevel: 2 },
    { role: 'Ylläpitäjä', accessLevel: 3 }
]

function UserAccess({ u, services }) {
    return <ul className='flex min-w-0 flex-col gap-1'>
        {u.access.map((entry) => {
            const service = services.find((item) => item._id === entry.service)
            const level = accessLevels.find((item) => item.accessLevel === entry.level)
            if (!service) return null
            return <li key={entry.service + u._id} className='flex min-w-0 flex-wrap items-center gap-1'>
                <a href={`${service.protocol}://${service.domain}`} target='_blank' rel='noreferrer' className='text-xs font-medium text-primary hover:underline'>{service.name}</a>
                <span className='text-xs text-muted-foreground'>· {level?.role}</span>
            </li>
        })}
    </ul>
}

function SetAccessLevel({ user, onSaved }) {
    const { services, users, setUsers } = useStore()
    const [access, setAccess] = useState(() => user.access.map((entry) => ({
        service: String(entry.service),
        level: String(entry.level),
    })))
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    const saveAccess = async (event) => {
        event.preventDefault()
        if (access.some((entry) => !entry.service || !entry.level) ||
            new Set(access.map((entry) => entry.service)).size !== access.length) {
            setError('Valitse jokaiselle riville eri sovellus ja käyttöoikeustaso.')
            return
        }
        setSaving(true)
        setError('')
        try {
            const updatedUser = await usersApi.update(user._id, {
                access: access.map((entry) => ({
                    service: entry.service,
                    level: Number(entry.level),
                    name: services.find((service) => service._id === entry.service)?.name,
                })),
            })
            setUsers(users.map((u) => u._id === updatedUser._id ? updatedUser : u))
            onSaved()
        } catch (exception) {
            setError('Käyttöoikeuksia ei voitu tallentaa.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>Käyttäjän käyttöoikeudet</DialogTitle>
                <DialogDescription>
                    Tee muutoksia käyttäjän käyttöoikeuksiin. Paina Tallenna, kun olet valmis.
                </DialogDescription>
            </DialogHeader>
                <form onSubmit={saveAccess}>
                    <ul className="flex min-w-0 flex-col gap-3">
                        {access.map((entry, index) => (
                            <li key={index} className="flex w-full min-w-0 flex-wrap items-end gap-3">
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                    <label className="text-sm" htmlFor={`service-${index}`}>Sovellus</label>
                                    <Select value={entry.service} onValueChange={(value) => setAccess(access.map((item, i) => i === index ? { ...item, service: value } : item))}>
                                        <SelectTrigger id={`service-${index}`} className="w-full"><SelectValue placeholder="Valitse sovellus" /></SelectTrigger>
                                        <SelectContent><SelectGroup><SelectLabel>Sovellus</SelectLabel>
                                            {services.map((service) => <SelectItem key={service._id} value={service._id}>{service.name}</SelectItem>)}
                                        </SelectGroup></SelectContent>
                                    </Select>
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                    <label className="text-sm" htmlFor={`level-${index}`}>Käyttöoikeustaso</label>
                                    <Select value={entry.level} onValueChange={(value) => setAccess(access.map((item, i) => i === index ? { ...item, level: value } : item))}>
                                        <SelectTrigger id={`level-${index}`} className="w-full"><SelectValue placeholder="Valitse taso" /></SelectTrigger>
                                        <SelectContent><SelectGroup><SelectLabel>Käyttötaso</SelectLabel>
                                            {accessLevels.map((level) => <SelectItem key={level.accessLevel} value={String(level.accessLevel)}>{level.role}</SelectItem>)}
                                        </SelectGroup></SelectContent>
                                    </Select>
                                </div>
                                <Button variant='ghost' type="button" onClick={() => setAccess(access.filter((_, i) => i !== index))}>
                                    <Trash2 className="w-4 h-4" />
                                    <span className="sr-only">poista sovellus</span>
                                </Button>
                            </li>
                        ))}
                    </ul>
                    <div className="flex items-center gap-4 py-4">
                        <Button
                            type="button"
                            variant='ghost'
                            onClick={() => setAccess([...access, { service: '', level: '1' }])}
                        >
                            <Plus className="w-4 h-4" />
                            <span className="sr-only">lisaa sovellus</span>
                        </Button>
                        <Button variant='default' type='submit' disabled={saving}>Tallenna</Button>
                    </div>
                    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                </form>
        </DialogContent>
    )
}

function TableOptions({ u }) {
    const [open, setOpen] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [error, setError] = useState('')
    const { users, setUsers } = useStore()

    const toggleAdmin = async (u) => {
        try {
            const updatedUser = await usersApi.update(u._id, { admin: !u.admin })

            setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u))

        } catch (exception) { setError('Ylläpito-oikeutta ei voitu muuttaa.') }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Toiminnot käyttäjälle ${u.email}`}>
                            <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                        <DialogTrigger asChild>
                            <DropdownMenuItem>Määritä</DropdownMenuItem>
                        </DialogTrigger>
                        <DropdownMenuItem onClick={() => toggleAdmin(u)} >
                            {u.admin ? 'Poista oikeudet' : 'Anna oikeudet'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setError(''); setConfirmOpen(true) }}>
                            Poista käyttäjä
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                {open && <SetAccessLevel user={u} onSaved={() => setOpen(false)} />}
            </Dialog>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Poistetaanko käyttäjä {u.email}?</AlertDialogTitle>
                        <AlertDialogDescription>Käyttäjä ja hänen käyttöoikeutensa poistetaan pysyvästi.</AlertDialogDescription>
                    </AlertDialogHeader>
                    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Peruuta</AlertDialogCancel>
                        <AlertDialogAction onClick={async (event) => {
                            event.preventDefault()
                            try {
                                await usersApi.remove(u._id)
                                setUsers(users.filter((user) => user._id !== u._id))
                                setConfirmOpen(false)
                            } catch {
                                setError('Käyttäjää ei voitu poistaa.')
                            }
                        }}>Poista</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {!confirmOpen && error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        </>
    )
}

export default function Users() {
    const {
        user,
        authReady,
        users,
        services,
        setUsers,
        setServices
    } = useStore()
    const [loadError, setLoadError] = useState('')

    const loadUsers = useCallback(async () => {
        if (user && user.admin) {
            try {
                setUsers(await usersApi.getAll())

            } catch (exception) { setLoadError('Käyttäjiä ei voitu ladata. Päivitä sivu ja yritä uudelleen.') }
        }
    }, [user])

    const loadServices = useCallback(async () => {
        if (user && user.admin) {
            try {
                setServices(await servicesApi.getAll())

            } catch (exception) { setLoadError('Palveluita ei voitu ladata. Päivitä sivu ja yritä uudelleen.') }
        }
    }, [user])

    useEffect(() => {
        loadUsers()
        loadServices()
    }, [user])

    if (!authReady) return <main className="p-4">Ladataan...</main>

    if (!user || !user.admin) {
        return (
            <main className='flex flex-col grow justify-center items-center gap-2 px-4 pb-2 pt-4 sm:px-8 sm:py-4'>
                <h2 className='text-3xl'>Vain järjestelmänvalvojilla on oikeus käyttää tätä sivua.</h2>
                <Link to='/' className='font-medium text-primary hover:underline'>Takaisin etusivulle</Link>
            </main>
        )
    }

    return (
        <main className='w-full px-4 py-8 sm:px-6 sm:py-10'>
            <div className='mx-auto flex w-full max-w-6xl flex-col gap-6'>
                <div className='max-w-2xl'>
                    <h1 className='font-display text-3xl font-semibold tracking-tight'>Käyttäjät</h1>
                    <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>Hallitse käyttäjien palvelukohtaisia käyttöoikeuksia ja ylläpitäjän roolia. Oikeuksien muutokset tulevat voimaan seuraavan kirjautumisen jälkeen.</p>
                </div>
                {loadError && <p role='alert' className='text-sm text-destructive'>{loadError}</p>}
                <Card className='min-w-0 overflow-hidden'>
                    <CardHeader className='flex-row items-center justify-between gap-3 border-b'>
                        <div>
                            <CardTitle className='text-lg'>Käyttäjäluettelo</CardTitle>
                            <CardDescription>Valitse rivin valikosta rooli, käyttöoikeudet tai poisto.</CardDescription>
                        </div>
                        <Badge variant='secondary'>{users.length}</Badge>
                    </CardHeader>
                    <CardContent className='p-0'>
                <div className='divide-y md:hidden'>
                    {[...users].sort((a, b) => a.email.localeCompare(b.email)).map((u) => <div key={u._id} className='space-y-3 px-5 py-4'>
                        <div className='flex min-w-0 items-start justify-between gap-2'>
                            <p className='min-w-0 break-all text-sm font-semibold'>{u.email}</p>
                            <TableOptions u={u} />
                        </div>
                        <Badge variant={u.admin ? 'default' : 'outline'}>{u.admin ? 'Ylläpitäjä' : 'Käyttäjä'}</Badge>
                        <UserAccess u={u} services={services} />
                    </div>)}
                </div>
                <div className="hidden w-full overflow-x-auto md:block">
                <Table className="min-w-[640px]">
                    <TableCaption className='sr-only'>Käyttäjien käyttöoikeudet</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Sähköposti</TableHead>
                            <TableHead>Käyttöoikeustasot</TableHead>
                            <TableHead>Rooli</TableHead>
                            <TableHead className="w-[100px] text-right"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...users].sort((a, b) => a.email.localeCompare(b.email)).map((u) => (
                            <TableRow key={u._id}>
                                <TableCell className="max-w-[200px] break-words font-medium">{u.email}</TableCell>
                                <TableCell>
                                    <UserAccess u={u} services={services} />
                                </TableCell>
                                <TableCell>
                                    <Badge variant={u.admin ? 'default' : 'outline'}>{u.admin ? 'Ylläpitäjä' : 'Käyttäjä'}</Badge>
                                </TableCell>
                                <TableCell>
                                    <TableOptions u={u} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
