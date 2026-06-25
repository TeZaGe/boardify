'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, Check } from 'lucide-react'

interface AddressAutocompleteProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}

export function AddressAutocomplete({ value, onChange, placeholder, className }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Champs de saisie structurée
  const [street, setStreet] = useState('')
  const [zip, setZip] = useState('')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [country, setCountry] = useState('France')
  const [customCountry, setCustomCountry] = useState('')

  // Permet de parser une adresse existante pour pré-remplir les champs structurés
  const parseAddress = (addressStr: string) => {
    if (!addressStr) return { street: '', zip: '', city: '', region: '', country: 'France', customCountry: '' }
    const parts = addressStr.split(',').map(p => p.trim())
    
    let parsedStreet = ''
    let parsedZip = ''
    let parsedCity = ''
    let parsedRegion = ''
    let parsedCountry = 'France'
    
    if (parts.length === 1) {
      parsedCity = parts[0]
    } else if (parts.length === 2) {
      parsedCity = parts[0]
      parsedCountry = parts[1]
    } else if (parts.length === 3) {
      parsedCity = parts[0]
      parsedRegion = parts[1]
      parsedCountry = parts[2]
    } else if (parts.length === 4) {
      parsedZip = parts[0]
      parsedCity = parts[1]
      parsedRegion = parts[2]
      parsedCountry = parts[3]
    } else if (parts.length >= 5) {
      parsedStreet = parts[0]
      parsedZip = parts[1]
      parsedCity = parts[2]
      parsedRegion = parts[3]
      parsedCountry = parts.slice(4).join(', ')
    }
    
    const knownCountries = ['France', 'Belgique', 'Suisse', 'Luxembourg', 'Canada']
    const isKnown = knownCountries.includes(parsedCountry)
    
    return {
      street: parsedStreet,
      zip: parsedZip,
      city: parsedCity,
      region: parsedRegion,
      country: isKnown ? parsedCountry : (parsedCountry ? 'Autre' : 'France'),
      customCountry: isKnown ? '' : parsedCountry
    }
  }

  // Initialisation des champs à partir de la valeur initiale
  useEffect(() => {
    if (value) {
      const parsed = parseAddress(value)
      setStreet(parsed.street)
      setZip(parsed.zip)
      setCity(parsed.city)
      setRegion(parsed.region)
      setCountry(parsed.country)
      setCustomCountry(parsed.customCountry)
    }
  }, [value])

  // Détecte clic en dehors pour fermer les suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Met à jour la valeur combinée dans le parent à chaque modification manuelle
  const handleInputChange = (field: string, val: string) => {
    let currentStreet = street
    let currentZip = zip
    let currentCity = city
    let currentRegion = region
    let currentCountry = country
    let currentCustom = customCountry

    if (field === 'street') { setStreet(val); currentStreet = val; }
    if (field === 'zip') { setZip(val); currentZip = val; }
    if (field === 'city') { setCity(val); currentCity = val; }
    if (field === 'region') { setRegion(val); currentRegion = val; }
    if (field === 'country') { setCountry(val); currentCountry = val; }
    if (field === 'customCountry') { setCustomCountry(val); currentCustom = val; }

    const finalCountry = currentCountry === 'Autre' ? currentCustom : currentCountry
    const parts = [currentStreet, currentZip, currentCity, currentRegion, finalCountry]
      .map(p => p.trim())
      .filter(Boolean)
    const combined = parts.join(', ')
    onChange(combined)
  }

  // Recherche d'adresses via OpenStreetMap Nominatim à la demande ("Vérifier l'adresse")
  const handleVerifyAddress = async () => {
    const finalCountry = country === 'Autre' ? customCountry : country
    const queryParts = [street, zip, city, region, finalCountry].map(p => p.trim()).filter(Boolean)
    const query = queryParts.join(', ')

    if (!query.trim() || query.length < 3) return

    setLoading(true)
    setSuggestions([])
    setShowDropdown(true)

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'BoardifyApp/1.0 (thomas.modesto@gmail.com)'
          }
        }
      )
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data)
        if (data.length === 0) {
          setShowDropdown(false)
          alert("Aucune adresse précise correspondante trouvée. Vous pouvez conserver votre saisie manuelle.")
        }
      }
    } catch (err) {
      console.error('Error verifying address:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSuggestion = (item: any) => {
    const display = item.display_name
    onChange(display)
    
    // Parser la suggestion sélectionnée pour mettre à jour les inputs individuels
    const parsed = parseAddress(display)
    setStreet(parsed.street)
    setZip(parsed.zip)
    setCity(parsed.city)
    setRegion(parsed.region)
    setCountry(parsed.country)
    setCustomCountry(parsed.customCountry)

    setShowDropdown(false)
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 2000)
  }

  const isVerifyEnabled = (city.trim().length > 0 || region.trim().length > 0) && country.trim().length > 0

  return (
    <div className="relative w-full flex flex-col gap-2 p-4 bg-foreground/2 border border-border-color rounded-2xl" ref={dropdownRef}>
      
      {/* Adresse précise (numéro & rue) */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">N° & Nom de Rue</label>
        <input
          type="text"
          placeholder="ex: 10 Rue de la Paix"
          value={street}
          onChange={(e) => handleInputChange('street', e.target.value)}
          className="w-full bg-foreground/3 border border-border-color rounded-xl py-2 px-3 text-xs text-foreground placeholder:text-text-muted/40 focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Code Postal */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Code Postal</label>
          <input
            type="text"
            placeholder="ex: 75002"
            value={zip}
            onChange={(e) => handleInputChange('zip', e.target.value)}
            className="w-full bg-foreground/3 border border-border-color rounded-xl py-2 px-3 text-xs text-foreground placeholder:text-text-muted/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Ville */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Ville</label>
          <input
            type="text"
            placeholder="ex: Paris"
            value={city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className="w-full bg-foreground/3 border border-border-color rounded-xl py-2 px-3 text-xs text-foreground placeholder:text-text-muted/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Région */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Région</label>
          <input
            type="text"
            placeholder="ex: Île-de-France"
            value={region}
            onChange={(e) => handleInputChange('region', e.target.value)}
            className="w-full bg-foreground/3 border border-border-color rounded-xl py-2 px-3 text-xs text-foreground placeholder:text-text-muted/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Pays */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Pays</label>
          <select
            value={country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className="w-full bg-foreground/3 border border-border-color rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
          >
            <option value="France" className="bg-bg-side text-slate-900 dark:text-slate-100">France</option>
            <option value="Belgique" className="bg-bg-side text-slate-900 dark:text-slate-100">Belgique</option>
            <option value="Suisse" className="bg-bg-side text-slate-900 dark:text-slate-100">Suisse</option>
            <option value="Luxembourg" className="bg-bg-side text-slate-900 dark:text-slate-100">Luxembourg</option>
            <option value="Canada" className="bg-bg-side text-slate-900 dark:text-slate-100">Canada</option>
            <option value="Autre" className="bg-bg-side text-slate-900 dark:text-slate-100">Autre...</option>
          </select>
        </div>
      </div>

      {country === 'Autre' && (
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Nom du Pays</label>
          <input
            type="text"
            placeholder="ex: Espagne"
            value={customCountry}
            onChange={(e) => handleInputChange('customCountry', e.target.value)}
            className="w-full bg-foreground/3 border border-border-color rounded-xl py-2 px-3 text-xs text-foreground placeholder:text-text-muted/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      )}

      {/* Bouton de vérification / autocomplétion à la demande */}
      <div className="flex items-center justify-between mt-1 pt-2 border-t border-border-color/40">
        <span className="text-[9px] text-text-muted italic">Saisie manuelle ou vérification assistée</span>
        <button
          type="button"
          disabled={loading || !isVerifyEnabled}
          onClick={handleVerifyAddress}
          className="bg-primary/10 border border-primary/20 hover:bg-primary/15 text-purple-400 disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-bold py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
        >
          {loading ? (
            <Loader2 size={11} className="animate-spin" />
          ) : showSuccessMessage ? (
            <Check size={11} className="text-emerald-400" />
          ) : (
            <MapPin size={11} />
          )}
          {showSuccessMessage ? 'Adresse validée !' : 'Vérifier & formater l\'adresse'}
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute left-4 right-4 bottom-full mb-1 bg-bg-side border border-border-color rounded-xl shadow-2xl z-[110] max-h-[200px] overflow-y-auto">
          <div className="px-3 py-1.5 text-[9px] font-bold text-text-muted uppercase tracking-wider border-b border-border-color/30 bg-foreground/2">
            Adresses correspondantes :
          </div>
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSuggestion(item)}
              className="w-full text-left px-4 py-2.5 hover:bg-foreground/5 text-[10px] text-foreground transition-colors flex items-start gap-2 border-b border-border-color/30 last:border-b-0 cursor-pointer"
            >
              <MapPin size={12} className="text-primary flex-shrink-0 mt-0.5" />
              <span className="truncate flex-1">{item.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
