export interface Address {
  avenue?: string;
  commune_secteur_chefferie_id?: string;
  numero_avenue?: string;
  province_id?: string;
  quartier_village_id?: string;
  territoire_ville_id?: string;
}

export interface PatientRUA {
  adresse?: Address;
  boite_postale?: string;
  canal_enregistrement?: string;
  commune_secteur_chefferie_origine_id?: string;
  compagnie?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  enregistre_par_id_etablissement?: string;
  enregistre_par_nom_utilisateur?: string;
  fonction?: string;
  grade?: string;
  initial_groupe_sanguin?: string;
  initial_niveau_etude?: string;
  initial_langue?: string[];
  initial_programme?: string[];
  initial_religion?: string;
  is_compagnie_publique?: boolean;
  is_secteur_formel?: boolean;
  profession?: string;
  province_origine_id?: string;
  quartier_village_origine_id?: string;
  territoire_ville_origine_id?: string;
  telephone_principal?: string;
  telephone_secondaire?: string;
  email?: string;
  nom?: string;
  prenom?: string;
  postnom?: string;
  initial_sexe?: string;
  initial_etat_civil?: string;
}
