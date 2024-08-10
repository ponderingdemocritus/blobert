import { Command } from "@sapphire/framework";
import { questionStatement } from "../models/statements/index.js";
import { getImage } from "../contract/index.js";
import sharp from "sharp";
import { writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getText } from "../models/dalle/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Question extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, { ...options, description: "Ask a question to Blobert" });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((builder) =>
          builder //
            .setName("question")
            .setDescription("Ask a question")
            .setRequired(true)
        )
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    const question = interaction.options.getString("question");

    await interaction.deferReply();

    const response = await getText(questionStatement, question as string);
    const svgImage = await getImage(); // Assuming this returns the SVG content as a string or buffer

    // Convert SVG to PNG using sharp
    const pngBuffer = await sharp(Buffer.from(svgImage)).png().toBuffer();

    // Save the PNG to a file
    const imagePath = path.join(__dirname, "./blobert.png");
    await writeFile(imagePath, pngBuffer);

    const embed = {
      title: question || "Question",
      image: {
        url: "attachment://blobert.png",
      },
      description: response,
      url: "https://realms.world/collection/blobert",
    };

    return interaction.editReply({
      embeds: [embed],
      files: [
        {
          attachment: imagePath,
          name: "blobert.png",
        },
      ],
    });
  }
}
