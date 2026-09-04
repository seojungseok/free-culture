import petData from "@/data/pet-travel.json";

export type PetTravelPlace = {
  id: string;
  title: string;
  address?: string;
  addr?: string;
  area?: string;
  image?: string;
  mapx?: string;
  mapy?: string;
  type?: string;
  tel?: string;
  homepage?: string;
  summary?: string;
  petInfo?: string;
  overview?: string;
  intro?: Record<string, string>;
  images?: string[];
};

const places = (petData as unknown as { places?: Record<string, PetTravelPlace> }).places || {};

export function getPetTravelPlace(id: string) {
  return places[id] || null;
}

export function getPetTravelPlaces() {
  return Object.values(places);
}
