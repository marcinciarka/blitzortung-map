export type StrikeEntity = {
  entity_id: string;
  state: string;
  attributes: {
    source: string;
    latitude: number;
    longitude: number;
    external_id: string;
    attribution: string;
    publication_date: string;
    unit_of_measurement: string;
    icon: string;
    friendly_name: string;
  };
  last_changed: string;
  last_reported: string;
  last_updated: string;
  context: {
    id: string;
    parent_id: null;
    user_id: null;
  };
};
