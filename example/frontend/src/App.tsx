import {
  Admin,
  Resource,
  ListGuesser,
  EditGuesser,
} from "react-admin";
import drfProvider, {fetchJsonWithAuthJWTToken, jwtTokenAuthProvider} from "ra-data-drf-dynamic-rest";

const authProvider = jwtTokenAuthProvider({obtainAuthTokenUrl: "http://localhost:8000/api/token/"});
const dataProvider = drfProvider("http://localhost:8000/api", fetchJsonWithAuthJWTToken);

export const App = () => <Admin dataProvider={dataProvider} authProvider={authProvider}>

    <Resource name="posts"
        list={ListGuesser}
        edit={EditGuesser}
    />,
    <Resource name="comments"
        list={ListGuesser}
        edit={EditGuesser}
    />,
    <Resource name="tags"
        list={ListGuesser}
        edit={EditGuesser}/>,
</Admin>;
