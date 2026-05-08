import { injectable } from "tsyringe";
import {pool} from "../config/db";
import { AmbulanceCreateModel, CFRCreateModel, CFROrAmbulanceSearchFilter } from "../domain.types/cfr/cfr.domain.types";
import { CFRMapper } from "../mapper/cfr.mapper";
import { AmbulanceDto, CFRDto } from "../domain.types/cfr/cfr.dto";

@injectable()
export class CFRService {

    createCFR = async (model: CFRCreateModel) => {
        const query = `
          INSERT INTO cfr_locations (name, address, latitude, longitude, phone, tenantid,  locationpoint)
          VALUES ('${model.Name}', '${model.Address}', ${model.Latitude}, ${model.Longitude}, '${model.Phone}', '${model.TenantId}', ST_SetSRID(ST_MakePoint(${model.Latitude}, ${model.Longitude}), 4326)) RETURNING *
        `;
        const result = await pool.query(query);
        if (result.rows.length > 0) {
            return CFRMapper.toDto(result.rows[0]);
        }
    }

    createAmbulance = async (model: AmbulanceCreateModel) => {
        const query = `
          INSERT INTO ambulance_locations (name, address, latitude, longitude, phone, tenantid, locationpoint)
          VALUES ('${model.Name}', '${model.Address}', ${model.Latitude}, ${model.Longitude}, '${model.Phone}', '${model.TenantId}', ST_SetSRID(ST_MakePoint(${model.Latitude}, ${model.Longitude}), 4326)) RETURNING *
        `;
        const result = await pool.query(query);
        if (result.rows.length > 0) {
            return CFRMapper.toAmbulanceDto(result.rows[0]);
        }
    }

    getNearestCFRs = async (filters: CFROrAmbulanceSearchFilter, tenantId: string)=> {
        
        const query = `
            SELECT name, address, latitude, longitude, phone,
                    ST_Distance(
                    ST_SetSRID(ST_MakePoint(${filters.Latitude}, ${filters.Longitude}), 4326)::geography, 
                    locationpoint::geography
                    ) AS distance
            FROM cfr_locations
                WHERE 
                    tenantId = '${tenantId}'
                    ${filters.RadiusInKm ? `AND ST_Distance(
                            ST_SetSRID(ST_MakePoint(${filters.Latitude}, ${filters.Longitude}), 4326)::geography, 
                            locationpoint::geography
                            ) <= ${filters.RadiusInKm * 1000}` : ''}
            ORDER BY distance
            LIMIT ${filters.ItemsPerPage};
            `;
          let { rows } = await pool.query(query);
          
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

    getNearestAmbulances = async (filters: CFROrAmbulanceSearchFilter, tenantId: string)=> {
        const query = `
            SELECT name, address, latitude, longitude, phone,
                    ST_Distance(
                    ST_SetSRID(ST_MakePoint(${filters.Latitude}, ${filters.Longitude}), 4326)::geography, 
                    locationpoint::geography
                    ) AS distance
            FROM ambulance_locations
                WHERE
                    tenantId = '${tenantId}'
                    ${filters.RadiusInKm ? `AND ST_Distance(
                            ST_SetSRID(ST_MakePoint(${filters.Latitude}, ${filters.Longitude}), 4326)::geography, 
                            locationpoint::geography
                            ) <= ${filters.RadiusInKm * 1000}` : ''}
            ORDER BY distance
            LIMIT ${filters.ItemsPerPage};
            `;
          let { rows } = await pool.query(query);

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

     deleteCFRsByTenantId = async (tenantId: string) => {
        const query = `DELETE FROM cfr_locations WHERE tenantid = '${tenantId}'`;
        const result = await pool.query(query);
        return result.rowCount;
    }

    deleteAmbulancesByTenantId = async (tenantId: string) => {
        const query = `DELETE FROM ambulance_locations WHERE tenantid = '${tenantId}'`;
        const result = await pool.query(query);
        return result.rowCount;
    }

    getCFRs = async (filters: CFROrAmbulanceSearchFilter, tenantId: string)=> {
        const query = `
            SELECT name, address, latitude, longitude, phone,
                    ST_Distance(
                    ST_SetSRID(ST_MakePoint(${filters.Latitude}, ${filters.Longitude}), 4326)::geography, 
                    locationpoint::geography
                    ) AS distance
            FROM cfr_locations
                WHERE 
                    tenantId = '${tenantId}'
            ORDER BY distance
            LIMIT ${filters.ItemsPerPage};
            `;
          const { rows } = await pool.query(query);
          return rows;
     };

    getAmbulances = async (filters: CFROrAmbulanceSearchFilter, tenantId: string)=> {
        const query = `
            SELECT name, address, latitude, longitude, phone,
                    ST_Distance(
                    ST_SetSRID(ST_MakePoint(${filters.Latitude}, ${filters.Longitude}), 4326)::geography, 
                    locationpoint::geography
                    ) AS distance
            FROM ambulance_locations
                WHERE 
                    tenantId = '${tenantId}'
            ORDER BY distance
            LIMIT ${filters.ItemsPerPage};
            `;
          const { rows } = await pool.query(query);
          return rows;
     };
   
     removeSelfReportingCFR = (cfrs: CFRDto[], filters: CFROrAmbulanceSearchFilter) => {
        if (cfrs.length > 0 && filters.ReporterPhone) {
            return cfrs.filter(cfr => cfr.Phone !== filters.ReporterPhone);
        }
        return cfrs;
    }
}
