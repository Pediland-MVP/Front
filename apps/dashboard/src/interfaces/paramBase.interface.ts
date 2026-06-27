export default interface ParamBaseInterface {
  params: { [key: string]: string } & {
    locale: 'en' | 'fa';
  };
}
