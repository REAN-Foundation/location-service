export interface BaseSearchFilter {
    ItemsPerPage?: number;
}
export interface CFROrAmbulanceSearchFilter extends BaseSearchFilter {
    Latitude?: number;
    Longitude?: number;
    RadiusInKm?: number;
    MinRadiusInKm?: number;
    MaxRadiusInKm?: number;
    ReporterPhone?: string;
}

export interface CFRCreateModel {
    Name?: string;
    TenantId?: string;
    Address?: string;
    Latitude?: number;
    Longitude?: number;
    Phone?: string;
}

export interface AmbulanceCreateModel {
    Name?: string;
    TenantId?: string;
    Address?: string;
    Latitude?: number;
    Longitude?: number;
    Phone?: string;
}

export interface CFRUpdateLocationModel {
    Phone: string;
    Latitude: number;
    Longitude: number;
}
