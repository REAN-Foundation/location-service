import { injectable } from "tsyringe";
import {pool} from "../config/db";
import { AmbulanceCreateModel, CFRCreateModel, CFROrAmbulanceSearchFilter, CFRUpdateLocationModel } from "../domain.types/cfr/cfr.domain.types";
import { CFRMapper } from "../mapper/cfr.mapper";
import { AmbulanceDto, CFRDto } from "../domain.types/cfr/cfr.dto";

@injectable()
export class CFRService {

    createCFR = async (model: CFRCreateModel) => {
        const query = `
          INSERT INTO cfr_locations (name, address, latitude, longitude, phone, tenantid, locationpoint)
          VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($4, $3), 4326)) RETURNING *
        `;
        const result = await pool.query(query, [model.Name, model.Address, model.Latitude, model.Longitude, model.Phone, model.TenantId]);
        if (result.rows.length > 0) {
            return CFRMapper.toDto(result.rows[0]);
        }
    }

    createAmbulance = async (model: AmbulanceCreateModel) => {
        const query = `
          INSERT INTO ambulance_locations (name, address, latitude, longitude, phone, tenantid, locationpoint)
          VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($4, $3), 4326)) RETURNING *
        `;
        const result = await pool.query(query, [model.Name, model.Address, model.Latitude, model.Longitude, model.Phone, model.TenantId]);
        if (result.rows.length > 0) {
            return CFRMapper.toAmbulanceDto(result.rows[0]);
        }
    }

    getNearestCFRs = async (filters: CFROrAmbulanceSearchFilter, tenantId: string)=> {

        const params: any[] = [filters.Longitude, filters.Latitude, tenantId];
        let radiusClause = '';
        if (filters.RadiusInKm) {
            params.push(filters.RadiusInKm * 1000);
            radiusClause = `AND ST_DWithin(locationpoint::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $${params.length})`;
        }
        params.push(filters.ItemsPerPage);
        const limitIndex = params.length;

        const query = `
            SELECT name, address, latitude, longitude, phone,
                    ST_Distance(
                    locationpoint::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                    ) AS distance
            FROM cfr_locations
                WHERE
                    tenantid = $3
                    ${radiusClause}
            ORDER BY locationpoint <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            LIMIT $${limitIndex};
            `;
          let { rows } = await pool.query(query, params);

        //   if (rows.length === 0 && filters.RadiusInKm) {
        //      rows = await this.getCFRs(filters, tenantId);
        //     }

          let searchResults: CFRDto[] = [];
          for (let i = 0; i < rows.length; i++) {
              rows[i] = CFRMapper.toDto(rows[i]);
              searchResults.push(rows[i]);
          }

          searchResults = this.removeSelfReportingCFR (searchResults, filters);
          return searchResults;
     };

    getNearestCFRs1 = async (filters: CFROrAmbulanceSearchFilter, tenantId: string): Promise<CFRDto[]> => {
        const params: any[] = [filters.Longitude, filters.Latitude, tenantId];
        let extraClauses = '';
        if (filters.MaxRadiusInKm) {
            params.push(filters.MaxRadiusInKm * 1000);
            extraClauses += ` AND ST_DWithin(locationpoint::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $${params.length})`;
        }
        if (filters.MinRadiusInKm) {
            params.push(filters.MinRadiusInKm * 1000);
            extraClauses += ` AND ST_Distance(locationpoint::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) >= $${params.length}`;
        }
        params.push(filters.ItemsPerPage);
        const limitIndex = params.length;

        const query = `
            SELECT name, address, latitude, longitude, phone,
                    ST_Distance(
                    locationpoint::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                    ) AS distance
            FROM cfr_locations
                WHERE
                    tenantid = $3
                    ${extraClauses}
            ORDER BY locationpoint <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            LIMIT $${limitIndex};
        `;
        const { rows } = await pool.query(query, params);
        let searchResults: CFRDto[] = rows.map(row => CFRMapper.toDto(row));
        searchResults = this.removeSelfReportingCFR(searchResults, filters);
        return searchResults;
    };

    getNearestAmbulances = async (filters: CFROrAmbulanceSearchFilter, tenantId: string)=> {
        const params: any[] = [filters.Longitude, filters.Latitude, tenantId];
        let radiusClause = '';
        if (filters.RadiusInKm) {
            params.push(filters.RadiusInKm * 1000);
            radiusClause = `AND ST_DWithin(locationpoint::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $${params.length})`;
        }
        params.push(filters.ItemsPerPage);
        const limitIndex = params.length;

        const query = `
            SELECT name, address, latitude, longitude, phone,
                    ST_Distance(
                    locationpoint::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                    ) AS distance
            FROM ambulance_locations
                WHERE
                    tenantid = $3
                    ${radiusClause}
            ORDER BY locationpoint <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            LIMIT $${limitIndex};
            `;
          let { rows } = await pool.query(query, params);

          if (rows.length === 0 && filters.RadiusInKm) {
            rows = await this.getAmbulances(filters, tenantId);
          }
          
          const searchResults: AmbulanceDto[] = [];
          for (let i = 0; i < rows.length; i++) {
              rows[i] = CFRMapper.toAmbulanceDto(rows[i]);
              searchResults.push(rows[i]);
          }

          return searchResults;
     };

    responderExists = async (phone: string, tenantId: string): Promise<boolean> => {
        const query = `
            SELECT 1
            FROM cfr_locations
            WHERE phone = $1 AND tenantid = $2
            LIMIT 1
        `;
        const result = await pool.query(query, [phone, tenantId]);
        return result.rows.length > 0;
    }

    updateCFRLocation = async (model: CFRUpdateLocationModel, tenantId: string): Promise<CFRDto | null> => {
        const query = `
            UPDATE cfr_locations
            SET latitude = $1, longitude = $2,
                locationpoint = ST_SetSRID(ST_MakePoint($2, $1), 4326)
            WHERE phone = $3 AND tenantid = $4
            RETURNING *
        `;
        const result = await pool.query(query, [model.Latitude, model.Longitude, model.Phone, tenantId]);
        if (result.rows.length === 0) {
            return null;
        }
        return CFRMapper.toDto(result.rows[0]);
    }

     deleteCFRsByTenantId = async (tenantId: string) => {
        const query = `DELETE FROM cfr_locations WHERE tenantid = $1`;
        const result = await pool.query(query, [tenantId]);
        return result.rowCount;
    }

    deleteAmbulancesByTenantId = async (tenantId: string) => {
        const query = `DELETE FROM ambulance_locations WHERE tenantid = $1`;
        const result = await pool.query(query, [tenantId]);
        return result.rowCount;
    }

    getCFRs = async (filters: CFROrAmbulanceSearchFilter, tenantId: string)=> {
        const query = `
            SELECT name, address, latitude, longitude, phone,
                    ST_Distance(
                    locationpoint::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                    ) AS distance
            FROM cfr_locations
                WHERE
                    tenantid = $3
            ORDER BY locationpoint <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            LIMIT $4;
            `;
          const { rows } = await pool.query(query, [filters.Longitude, filters.Latitude, tenantId, filters.ItemsPerPage]);
          return rows;
     };

    getAmbulances = async (filters: CFROrAmbulanceSearchFilter, tenantId: string)=> {
        const query = `
            SELECT name, address, latitude, longitude, phone,
                    ST_Distance(
                    locationpoint::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                    ) AS distance
            FROM ambulance_locations
                WHERE
                    tenantid = $3
            ORDER BY locationpoint <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            LIMIT $4;
            `;
          const { rows } = await pool.query(query, [filters.Longitude, filters.Latitude, tenantId, filters.ItemsPerPage]);
          return rows;
     };
   
     removeSelfReportingCFR = (cfrs: CFRDto[], filters: CFROrAmbulanceSearchFilter) => {
        if (cfrs.length > 0 && filters.ReporterPhone) {
            return cfrs.filter(cfr => cfr.Phone !== filters.ReporterPhone);
        }
        return cfrs;
    }
}
