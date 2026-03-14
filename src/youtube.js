/**
 * Generate a formatted YouTube description from movie data.
 */
export function formatYouTubeDescription(title, credits, certificates, boxOffice) {
  const lines = [];

  // Title & Year
  const yearStr = title.startYear
    ? (title.endYear ? `${title.startYear}–${title.endYear}` : `${title.startYear}`)
    : '';
  lines.push(`🎬 ${title.primaryTitle} (${yearStr})`);
  lines.push('');

  // Type
  const typeMap = {
    movie: 'Movie',
    tvSeries: 'TV Series',
    tvMiniSeries: 'TV Mini-Series',
    tvMovie: 'TV Movie',
    tvSpecial: 'TV Special',
    short: 'Short',
    video: 'Video',
    videoGame: 'Video Game',
  };
  if (title.type) {
    lines.push(`📺 Type: ${typeMap[title.type] || title.type}`);
  }

  // Genres
  if (title.genres && title.genres.length) {
    lines.push(`🎭 Genre: ${title.genres.join(', ')}`);
  }

  // Runtime
  if (title.runtimeSeconds) {
    const mins = Math.round(title.runtimeSeconds / 60);
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    lines.push(`⏱️ Runtime: ${hrs > 0 ? `${hrs}h ` : ''}${remainMins}m`);
  }

  // Rating
  if (title.rating) {
    lines.push(`⭐ IMDb Rating: ${title.rating.aggregateRating}/10 (${title.rating.voteCount?.toLocaleString()} votes)`);
  }

  lines.push('');

  // Plot
  if (title.plot) {
    lines.push(`📖 Plot:`);
    lines.push(title.plot);
    lines.push('');
  }

  // Directors
  if (credits) {
    const directors = credits.credits?.filter(c => c.category === 'director') || title.directors || [];
    if (directors.length) {
      const dirNames = directors.map(d => d.name?.displayName || d.displayName).filter(Boolean);
      if (dirNames.length) {
        lines.push(`🎬 Director(s): ${dirNames.join(', ')}`);
      }
    }

    // Writers
    const writers = credits.credits?.filter(c => c.category === 'writer') || title.writers || [];
    if (writers.length) {
      const writerNames = writers.map(w => w.name?.displayName || w.displayName).filter(Boolean);
      if (writerNames.length) {
        lines.push(`✍️ Writer(s): ${writerNames.join(', ')}`);
      }
    }

    // Cast
    const cast = credits.credits?.filter(c =>
      c.category === 'actor' || c.category === 'actress' || c.category === 'self'
    ) || title.stars || [];
    if (cast.length) {
      const castNames = cast.slice(0, 10).map(a => {
        const name = a.name?.displayName || a.displayName;
        const chars = a.characters?.join(', ');
        return chars ? `${name} as ${chars}` : name;
      }).filter(Boolean);
      if (castNames.length) {
        lines.push('');
        lines.push(`🌟 Cast:`);
        castNames.forEach(n => lines.push(`  • ${n}`));
      }
    }
  }

  lines.push('');

  // Certificates
  if (certificates && certificates.certificates?.length) {
    const certs = certificates.certificates.map(c => `${c.country?.name || c.country?.code}: ${c.rating}`);
    lines.push(`📋 Certificates: ${certs.join(' | ')}`);
  }

  // Box Office
  if (boxOffice) {
    const parts = [];
    if (boxOffice.productionBudget) {
      parts.push(`Budget: $${Number(boxOffice.productionBudget.amount).toLocaleString()}`);
    }
    if (boxOffice.domesticGross) {
      parts.push(`Domestic: $${Number(boxOffice.domesticGross.amount).toLocaleString()}`);
    }
    if (boxOffice.worldwideGross) {
      parts.push(`Worldwide: $${Number(boxOffice.worldwideGross.amount).toLocaleString()}`);
    }
    if (parts.length) {
      lines.push(`💰 Box Office: ${parts.join(' | ')}`);
    }
  }

  lines.push('');
  lines.push(`🔗 IMDb: https://www.imdb.com/title/${title.id}/`);
  lines.push('');
  lines.push(`#${title.primaryTitle?.replace(/[^a-zA-Z0-9]/g, '')} #IMDb #Movies #TVShows`);

  return lines.join('\n');
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}
