export interface BaseSearchFilter {
    ItemsPerPage?: number;
}
export interface CFROrAmbulanceSearchFilter extends BaseSearchFilter {
    Latitude?: number;
    Longitude?: number;
    RadiusInKm?: number;
}

export interface CFRCreateModel {
    Name?: string;
    TenantId?: string;
    Address?: string;
    Latitude?: number;
    Longitude?: number;
    PhoneNumber?: string;
}

export interface AmbulanceCreateModel {
    Name?: string;
    TenantId?: string;
    Address?: string;
    Latitude?: number;
    Longitude?: number;
    PhoneNumber?: string;
}
