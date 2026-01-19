import EXSH_LOGO from "./EXSH_logo_HTV2.webp";
import ATSH_LOGO from "./AnhTraiSayHiOpening.jpg";
import HOT_SONGS_LOGO from "./hot-in-month.png";
import SONG_CA_LOGO from "./50-bai-hat-song-ca-duoc-yeu-thich-1.jpg";
import VIET_NAM_SONG_LOGO from "./vietnam-741.gif";
import RAP_VIET_LOGO from "./rap-viet.jpeg";
import TET_LOGO from "./Tet.png";

export const CategoriesId = {
  HOT_SONGS: "bai-hat-dang-hot",
  VIET_NAM_SONG: "viet-nam-song",
  EM_XINH_SAY_HI: "em-xinh-say-hi",
  ANH_TRAI_SAY_HI: "anh-trai-say-hi",
  ANH_TRAI_VUOT_NGAN_TRONG_GAI: "anh-trai-vuot-ngan-trong-gai",
  RAP_VIET: "rap-viet",
  SONG_CA: "song-ca",
  TET: "tet",
  HOT_HIT_MOT_THOI: "hot-hit-mot-thoi",
  NHAC_2000S: "nhac-2000s",
};

export const categoryImages = {
  [CategoriesId.HOT_SONGS]: HOT_SONGS_LOGO,
  [CategoriesId.VIET_NAM_SONG]: VIET_NAM_SONG_LOGO,
  [CategoriesId.EM_XINH_SAY_HI]: EXSH_LOGO,
  [CategoriesId.ANH_TRAI_SAY_HI]: ATSH_LOGO,
  [CategoriesId.SONG_CA]: SONG_CA_LOGO,
  [CategoriesId.RAP_VIET]: RAP_VIET_LOGO,
  [CategoriesId.HOT_HIT_MOT_THOI]: RAP_VIET_LOGO,
  [CategoriesId.TET]: TET_LOGO,
  [CategoriesId.NHAC_2000S]: HOT_SONGS_LOGO, // Tạm dùng HOT_SONGS_LOGO, có thể thay bằng hình riêng sau
};

export { EXSH_LOGO, ATSH_LOGO, SONG_CA_LOGO, HOT_SONGS_LOGO, TET_LOGO };
