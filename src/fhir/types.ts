export type Coding = {
  system: string;
  code: string;
  display: string;
};

export type Reference = {
  reference: string;
  display: string;
};

export type Extension = {
  url: string;
  valueString?: string;
  valueBoolean?: boolean;
  valueDateTime?: string;
  valueCoding?: Coding;
  valueReference?: Reference;
  extension?: Extension[];
};

export type Address = {
  postalCode?: string;
  extension?: Extension[];
};

export type Language = {
  coding: Coding[];
  text: string;
};

export type Communication = {
  language: Language[];
};

export type Patient = {
  resourceType: 'Patient';
  extension?: Extension[];
  address?: Address;
  communication?: Communication;
  gender?: Language;
  maritalStatus?: Language;
};
