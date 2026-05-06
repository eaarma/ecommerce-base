interface TitleTextProps {
  title: string;
  image?: string | null;
}

const TitleText: React.FC<TitleTextProps> = ({ title, image }) => {
  const initial = title.trim().charAt(0).toUpperCase() || "S";

  return (
    <div className="flex items-center space-x-2 md:space-x-4 p-1 md:p-2">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={`${title} logo`}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
          {initial}
        </div>
      )}
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
  );
};

export default TitleText;
