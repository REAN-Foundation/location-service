import { uuid } from "../miscellanuous/system.types"

export interface CFRDto {
    id?: uuid,
    Name?: string,
    TenantId?: string,
    Address: string,
    Latitude?: number,
    Longitude?: number,
    PhoneNumber?: string,
}

export interface AmbulanceDto {
    id?: uuid,
    TenantId?: string,
    Name?: string,
    Address: string,
    Latitude?: number,
    Longitude?: number,
    PhoneNumber?: string,
}
