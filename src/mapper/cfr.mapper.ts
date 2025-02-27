import { AmbulanceDto, CFRDto } from "../domain.types/cfr/cfr.dto";

export class CFRMapper {
    static toDto (cfr: any): CFRDto {
        if (!cfr) {
            return null
        }
        const dto: CFRDto = {
            id: cfr.id,
            TenantId: cfr.tenantid,
            Name: cfr.name,
            Address: cfr.address,
            Latitude: cfr.latitude,
            Longitude: cfr.longitude,
            PhoneNumber: cfr.phonenumber
        }
        return dto
    }

    static toAmbulanceDto (cfr: any): AmbulanceDto {
        if (!cfr) {
            return null
        }
        const dto: AmbulanceDto = {
            id: cfr.id,
            TenantId: cfr.tenantid,
            Name: cfr.name,
            Address: cfr.address,
            Latitude: cfr.latitude,
            Longitude: cfr.longitude,
            PhoneNumber: cfr.phonenumber
        }
        return dto
    }
}
