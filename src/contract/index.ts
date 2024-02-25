import { Contract, RpcProvider, shortString } from "starknet";
import ABI from "./BlobertABI.json" assert { type: "json" };

const blobertAddress =
  "0x00539F522b29AE9251DbF7443c7A950CF260372e69EfaB3710A11Bf17a9599f1";

function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const getImage = async () => {
  const provider = new RpcProvider({ nodeUrl: process.env.BLAST_API });

  const blobert = new Contract(ABI, blobertAddress, provider);

  const image = await blobert.call("svg_image", [getRandomNumber(1, 4844)]);

  // Assuming `image.data` is the array provided
  // @ts-ignore
  const svgParts = image.data.map((part) => {
    return shortString.decodeShortString(part);
  });

  // @ts-ignore
  const pendingWordHex = shortString.decodeShortString(image.pending_word);
  svgParts.push(pendingWordHex);

  // Concatenate all parts to form the full SVG image
  const svgImage = svgParts.join("");

  console.log(svgImage);

  return svgImage;
};
