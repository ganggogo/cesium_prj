function filter(data, type, func)
{
  return data.filter(function(t)
  {
    return t.geotype === type && func(t)
  })
}

function find(data, type, func)
{
  return data.find(function(t)
  {
    return type.includes(t.geotype) && func(t)
  })
}

function isInPolygon(x, y, r, c)
{
  if (r.ymin < 0 || r.ymax < 0)
  {
    let min = r.ymin, max = r.ymax
    r.ymin = Math.abs(max)
    r.ymax = Math.abs(min)
  }
  // if (x < r.xmin || x > r.xmax || y < Math.abs(r.ymax) || y > Math.abs(r.ymin))
  if (x > r.xmin && x < r.xmax && y > r.ymin && y < r.ymax)
    return true
  else
    return false
  // let n = !1
  // for (let i = 0, l = c.length, j = l - 1; i < l; j = i++)
  // {
  //   if ((c[i][0] <= x && c[j][0] > x) || (c[j][0] <= x && c[i][0] > x))
  //     (Math.abs(c[j][1]) - Math.abs(c[i][1])) / (c[j][0] - c[i][0]) * (x - c[i][0]) + Math.abs(c[i][1]) > y && (n = !n)
  // }
  // return n
}

export default {
  filter: filter,
  find: find,
  eachPolygons(x, y, d)
  {
    return find(d, [4, 5], b =>
    {
      if (isInPolygon(x, y, b.rect, Array.isArray(b.geom.coordinates[0]) ? b.geom.coordinates : b.selfCoords))
        return b
    })
  }
}
