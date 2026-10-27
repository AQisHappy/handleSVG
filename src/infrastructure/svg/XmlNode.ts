export interface XmlTextNode {
  readonly type: 'text';
  readonly value: string;
}

export interface XmlElementNode {
  readonly type: 'element';
  readonly name: string;
  readonly attributes: ReadonlyMap<string, string>;
  readonly children: XmlNode[];
}

export type XmlNode = XmlTextNode | XmlElementNode;