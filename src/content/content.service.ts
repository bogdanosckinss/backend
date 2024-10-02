import { Injectable, StreamableFile } from '@nestjs/common';
import { DbService } from '../db/db.service'
import { ProfileDTO } from './dto/profile-d-t-o';
import { createReadStream } from 'fs';
import {writeFile} from 'fs';
import { promisify } from 'util';

@Injectable()
export class ContentService {
  constructor(private dbService: DbService) {}

  async updateVideoModerationStatus(data): Promise<any> {
    let dataToUpdate = {
      under_moderation: false,
      allowed: data.allowed
    }

    if (data.allowed) {
      dataToUpdate['preview_url'] = data?.previewImage ?? ''
    }

    return this.dbService.video.update({
      data: dataToUpdate,
      where: {
        id: data.videoId
      }
    })
  }


  async deleteVideo(videoId: string): Promise<any> {
    return this.dbService.video.update({
      where: {
        id: parseInt(videoId)
      },
      data: {
        under_moderation: false,
        allowed: false,
        deleted: true
      }
    })
  }

  async uploadContent(userId: number, data: ProfileDTO, videoId: number): Promise<any> {
    return this.dbService.user.update({
      where: {
        id: userId
      },
      data: {
        image: data.image,
        name: data.name,
        lastname: data.lastname,
        phone_number: data.phone_number.toString(),
        email: data.email,
        city: data.city,
        social_media_link: data.social_media_link,
        age: parseInt(String(data.age)),
        videos: {
          connect: {
            id: videoId
          }
        }
      },
    })
  }

  async uploadSong(data: any): Promise<any> {
    return this.dbService.song.create({
      data: {
        ...data
      }
    })
  }

  async getSongs(): Promise<any> {
    return this.dbService.song.findMany({
      orderBy: {
        id: 'desc'
      }
    })
  }

  async getVideosToModerate(skip: string): Promise<any> {
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE NOT video.allowed AND video.under_moderation IS TRUE AND NOT video.deleted
    ORDER BY video.created_at ASC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
    }

    return videos.map(video => {
      return {
        ...video,
        id: video.video_d,
        users: {
          name: video.name,
          lastname: video.lastname,
          city: video.city,
          age: video.age,
          email: video.email,
          image: video.image,
          phone_number: video.phone_number,
          social_media_link: video.social_media_link
        },
        song: {
          author_name: video.author_name,
          title: video.title,
          image_link: video.image_link
        },
      }
    })
  }

  async getDeclinedVideos(skip: string): Promise<any> {
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE NOT video.allowed AND NOT video.under_moderation AND NOT video.deleted
    ORDER BY video.created_at DESC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
    }

    return videos.map(video => {
      return {
        ...video,
        id: video.video_d,
        users: {
          name: video.name,
          lastname: video.lastname,
          city: video.city,
          age: video.age,
          email: video.email,
          image: video.image,
          phone_number: video.phone_number,
          social_media_link: video.social_media_link
        },
        song: {
          author_name: video.author_name,
          title: video.title,
          image_link: video.image_link
        },
      }
    })
  }

  async getDeclinedVideosCount(): Promise<any> {
    const declinedVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video
    WHERE NOT video.allowed AND NOT video.under_moderation AND NOT video.deleted`

    const acceptedVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video
    WHERE video.allowed IS TRUE AND NOT video.under_moderation AND NOT video.deleted`

    const underModerationVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video
    WHERE NOT video.allowed AND video.under_moderation IS TRUE AND NOT video.deleted`

    const totalModerationVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video WHERE NOT video.deleted`

    if (!declinedVideosCount || declinedVideosCount == 'unknown') {
      return 0
    }

    // @ts-ignore
    return {
      accepted: parseInt(acceptedVideosCount[0]?.counttoshow ?? 0),
      declined: parseInt(declinedVideosCount[0]?.counttoshow ?? 0),
      underModeration: parseInt(underModerationVideosCount[0]?.counttoshow ?? 0),
      total: parseInt(totalModerationVideosCount[0]?.counttoshow ?? 0)
    }
  }

  async getApprovedVideos(skip: string): Promise<any> {
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE video.allowed IS TRUE AND video.under_moderation IS FALSE
    ORDER BY video.id DESC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
    }

    return videos.map(video => {
      return {
        ...video,
        id: video.video_d,
        users: {
          name: video.name,
          lastname: video.lastname,
          city: video.city,
          age: video.age,
          email: video.email,
          image: video.image,
          phone_number: video.phone_number,
          social_media_link: video.social_media_link
        },
        song: {
          author_name: video.author_name,
          title: video.title,
          image_link: video.image_link
        },
      }
    })
  }

  async getContent(id: number): Promise<any> {
    return {};
    // return this.dbService.video.findMany({
    //   //take: 3, // TODO: remove
    //   where: {
    //     id: {
    //       not: {
    //         lt: 6
    //       }
    //     },
    //     under_moderation: false,
    //     allowed: true
    //   },
    //   orderBy: {
    //     videoLikes: {
    //       _count: 'desc'
    //     }
    //   },
    //   include: {
    //     users: true,
    //     song: true,
    //     videoLikes: {
    //       select: {
    //         id: true,
    //         video_id: true,
    //         user: {
    //           select: {
    //             id: true,
    //           },
    //         },
    //       },
    //     }
    //   }
    // })
  }

  async findManyVideosByUsername(skip: string, query: string, userId: number, startVideoId: string): Promise<any> {
    const queryToUse = query == 'null' ? '' : query
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d, (SELECT count(*) from video_likes as videoLike where videoLike.video_id = video.id AND videoLike.user_id = ${userId}) as is_liked_by_me, (SELECT count(*) from video_likes as videoLike where videoLike.video_id = video.id) as video_likes from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE video.allowed AND (LOWER(CONCAT(userc.lastname, ' ', userc.name)) LIKE LOWER(${'%' + queryToUse + '%'}) OR LOWER(CONCAT(userc.name, ' ', userc.lastname)) LIKE LOWER(${'%' + queryToUse + '%'}) OR LOWER(userc.name) LIKE LOWER(${'%' + queryToUse + '%'}) OR LOWER(ss.title) LIKE LOWER(${'%' + queryToUse + '%'}))
    ORDER BY (SELECT count(*) from video_likes as videoLike where videoLike.video_id = video.id) DESC, video.created_at ASC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
    }

    return videos.map(video => {
      return {
        ...video,
        id: video.video_d,
        users: {
          name: video.name,
          lastname: video.lastname,
          city: video.city,
          age: video.age,
          email: video.email,
          image: video.image
        },
        song: {
          author_name: video.author_name,
          title: video.title,
          image_link: video.image_link
        },
        video_likes: '',
        is_liked_by_me: parseInt(video.is_liked_by_me) > 0,
        videoLikes: parseInt(video.video_likes)
      }
    })
  }

  async cleanUsers(query: string): Promise<any> {
    // let data = ''
    // readXlsxFile('/Users/bohdanoskin/Documents/Other/extreme/domains/backend/src/content/ert.xlsx').then(rows => {
    //   for (const row in rows) {
    //     data += ('"' + rows[row][0] + '",\n')
    //   }
    //   this.createFile('/Users/bohdanoskin/Documents/Other/extreme/domains/backend/src/content', 'er.txt', data);
    // })
    //
    // return
    // const queryToUse = query == 'null' ? '' : query
    // if (queryToUse == '') {
    //   return {}
    // }

    return await this.dbService.$queryRaw`
        Delete from users as usr
        WHERE usr.email IN(
                           'sickb4t0aa@gonetor.com',
                           '3xu1llz7c2@smykwb.com',
                           'scherbakov.tehno@mail.ru',
                           'eyg1nxy7zc@bltiwd.com',
                           'tc2g7okm5x@zlorkun.com',
                           'qa23cho3xi@qacmjeq.com',
                           'jlnziei1g5@bltiwd.com',
                           'jpigm27ss1@qejjyl.com',
                           '5bwj9nr0a8@zvvzuv.com',
                           'qxcvu027an@zlorkun.com',
                           'ggjkrxvjvz@somelora.com',
                           '8szov3a9tt@zlorkun.com',
                           'n8ovtokqgj@smykwb.com',
                           'dbfrtez5zc@vvatxiy.com',
                           's7lcaaihsk@zvvzuv.com',
                           'pcmia3glt7@zvvzuv.com',
                           '5nlbzy3r43@zlorkun.com',
                           'cth6w2fu4l@smykwb.com',
                           'wngpn3oq3j@gonetor.com',
                           'galceva88@yandex.ru',
                           'uhfivenpuh@zlorkun.com',
                           'l5d54n41f7@knmcadibav.com',
                           '9mqas1ud3r@qzueos.com',
                           'apvifaa21c@gonetor.com',
                           '0y6ubwjoye@tippabble.com',
                           '89160307592y@gmail.com',
                           '582cj2gkz7@qejjyl.com',
                           'bhwihr5ngw@vafyxh.com',
                           'dima.shuhtin@gmail.com',
                           'bugryashkan@mail.ru',
                           'b1tbzvi1xu@vvatxiy.com',
                           'shov88@inbox.ru',
                           'dm4prqrufb@somelora.com',
                           'c80kqa7myj@wywnxa.com',
                           'tihanova-julia@mail.ru',
                           'iiwva11gpz@qzueos.com',
                           'azz8ha917a@smykwb.com',
                           'c16q3k1xtx@wywnxa.com',
                           'murly11@yandex.ru',
                           '64e2s8mmwh@wywnxa.com',
                           'nbb25e9est@vvatxiy.com',
                           '3k7w4555k8@bltiwd.com',
                           '1a8bnyyzzw@dygovil.com',
                           '9evl5bb6fk@dygovil.com',
                           'dwh0zu9pci@somelora.com',
                           'mdwuqmj6j4@tippabble.com',
                           'l0vlqp0dak@zlorkun.com',
                           'nyg1zq083z@qzueos.com',
                           'nwpggch7af@smykwb.com',
                           '5mh4t79ume@rfcdrive.com',
                           'gcolvknzqx@knmcadibav.com',
                           '57hy0hi0rm@dygovil.com',
                           '47yluj0bk1@wywnxa.com',
                           'lt1q7jguyi@zvvzuv.com',
                           'z8edif3zdq@zvvzuv.com',
                           '11ja34wvqr@dygovil.com',
                           '70jdlnga2b@vvatxiy.com',
                           'qfdc2epouf@zlorkun.com',
                           'qyr2gpalrl@somelora.com',
                           'cbyo1vftyi@qejjyl.com',
                           'x7n27hrszr@tippabble.com',
                           '7ddcfyfqxg@dygovil.com',
                           'klubloawdo@qzueos.com',
                           '2ckrx3naf1@zlorkun.com',
                           '0jrklr7p7t@tippabble.com',
                           'bkykj6c1e8@bltiwd.com',
                           'lfigmmjkap@rfcdrive.com',
                           'wjesurbbqq@qzueos.com',
                           '03mbsnrt99@somelora.com',
                           'ylm1dkjucn@wywnxa.com',
                           '2gksh8ncqm@qacmjeq.com',
                           'yc9jhm1xas@qzueos.com',
                           '8m1osnmh3i@qejjyl.com',
                           '54r5ebenjf@tidissajiiu.com',
                           'gsv6o1m3id@dygovil.com',
                           '3xmju3gwob@zlorkun.com',
                           'coenb4baaa@qacmjeq.com',
                           'pu5of5rlcg@zvvzuv.com',
                           '1hbbqcxqyk@rfcdrive.com',
                           '58mluurpfo@vvatxiy.com',
                           'wfdz0pnveo@somelora.com',
                           'cshlxz5d81@gonetor.com',
                           'h98aezlnxl@knmcadibav.com',
                           'ci8ultscou@zvvzuv.com',
                           'pkvw7uotxh@knmcadibav.com',
                           '1ji6cgr5lq@qzueos.com',
                           'ukjd1g4z5i@qejjyl.com',
                           '5yuzb0x5hl@wywnxa.com',
                           'nllsrq5gpm@qzueos.com',
                           'v2m8x1gzzu@tidissajiiu.com',
                           'txyxw53kcl@zvvzuv.com',
                           'a3y7ud2le2@zvvzuv.com',
                           '4bfvw54f5h@knmcadibav.com',
                           '0i3pj1z11s@vvatxiy.com',
                           'u5szxnzfc6@dygovil.com',
                           'jy6bivue3t@knmcadibav.com',
                           'msrmhjjkyn@bltiwd.com',
                           'cb0ifo019t@vafyxh.com',
                           '3i7j5tacyb@qzueos.com',
                           'qx2vua6yki@qejjyl.com',
                           'u7t7qspwfy@tippabble.com',
                           '4nz32d4vtv@somelora.com',
                           'c3vvpn9vrw@zvvzuv.com',
                           'yo6y2e18au@somelora.com',
                           'cysqhweh8a@tidissajiiu.com',
                           'ttlfkg0s9x@zlorkun.com',
                           'exc9lqmybs@zvvzuv.com',
                           '2xm0x79r1j@gonetor.com',
                           'zu9kqf26qe@zvvzuv.com',
                           'cyb9j0b9fm@knmcadibav.com',
                           '921szcllhy@zlorkun.com',
                           'm05zyjzw7t@wywnxa.com',
                           '32id08o9jd@tidissajiiu.com',
                           'va78p9w0h5@gonetor.com',
                           'xw1cwb6rvn@vafyxh.com',
                           'vob3x3b7qj@wywnxa.com',
                           'rizvaetn0n@zlorkun.com',
                           'safvtyadd7@dygovil.com',
                           'm4jzknv9dz@qzueos.com',
                           '3es6trj0zr@gonetor.com',
                           '0t56ccgear@dygovil.com',
                           '9hi6bubtfj@somelora.com',
                           '11b9tfo718@zlorkun.com',
                           'b1jji0cptt@tippabble.com',
                           'urvlrji86j@tidissajiiu.com',
                           'sngswsousl@bltiwd.com',
                           '7xlmauqm9q@knmcadibav.com',
                           'w7ilyviset@somelora.com',
                           'cjlckzhsqg@smykwb.com',
                           'ckdoxrh60d@tippabble.com',
                           'cyqjp466yp@zvvzuv.com',
                           'ganochkina-lm@mail.ru',
                           'alya.zaripova.03@bk.ru',
                           'jl4el9wsx8@qejjyl.com',
                           'x1vof7vp91@tippabble.com',
                           'lmjguhu5dt@vafyxh.com',
                           'ganochkin-av@inbox.ru',
                           'roman74rus@list.ru',
                           'vv21@inbox.ru',
                           'shaburova-1981@mail.ru',
                           '48suieyspn@tidissajiiu.com',
                           'pwpf5g6j0w@vvatxiy.com',
                           'chapaev-vladimir84@yandex.ru',
                           'yashik30004@mail.ru',
                           'yvmku6r5zs@knmcadibav.com',
                           'lena77vic@yandex.ru',
                           'ba7si9zpys@somelora.com',
                           '6nsm4z0e85@tippabble.com',
                           'geqaxy@clip.lat',
                           '39y4im4sqr@zlorkun.com',
                           'qojyjy@clip.lat',
                           'x577biwoj7@zlorkun.com',
                           'laviwa@cyclelove.cc',
                           'notexiqa@clip.lat',
                           'yuliya.dzhambarova@mail.ru',
                           'vb38rqh7f4@bltiwd.com',
                           'jykaqifi@cyclelove.cc',
                           'lina-serikova@mail.ru',
                           'welo@mail.ru',
                           '3wzft197a2@qejjyl.com',
                           'bolshoi12345@gmail.com',
                           'ruluvuca@cyclelove.cc',
                           'dan64vcwka@tippabble.com',
                           'mexovuvy@teleg.eu',
                           'jahecu@teleg.eu',
                           '6nv3qxz9ym@gonetor.com',
                           'rulicola@azuretechtalk.net',
                           'piquryno@polkaroad.net',
                           'widybu@teleg.eu',
                           'vijyde@teleg.eu',
                           'p24ziydk8y@gonetor.com',
                           'adhpsvgo7y@bltiwd.com',
                           'ubu92ng88n@qejjyl.com',
                           'bfz0m04w9f@tippabble.com',
                           '18z9tv3n42@gonetor.com',
                           'iev6f0gb5i@somelora.com',
                           'hffhtso2a3@qacmjeq.com',
                           'fdmqalc02o@gonetor.com',
                           'vjovm067j6@vafyxh.com',
                           'f0p9i4d4fa@gonetor.com',
                           'pkbz2o60d2@knmcadibav.com',
                           'h955ulhs9d@qzueos.com',
                           '8u5ebuekqx@vvatxiy.com',
                           'dn7lsjx46s@somelora.com',
                           '854mdmfrre@knmcadibav.com',
                           'x4gki9r0b1@rfcdrive.com',
                           'vsl3t4281w@bltiwd.com',
                           'nn0x738zok@zvvzuv.com',
                           '64poh2exb0@bltiwd.com',
                           'i1k9jplz4y@smykwb.com',
                           'mj7albps85@qejjyl.com',
                           'vwxihn8l8v@vvatxiy.com',
                           'oi01kl0rdl@vvatxiy.com',
                           'v5lyumc969@qzueos.com',
                           'se5gtx4wi6@dygovil.com',
                           'mictrgo8q9@zlorkun.com',
                           'p64jiljyvo@wywnxa.com',
                           'y0pcyjinl3@wywnxa.com',
                           '6dhaafn2oa@rfcdrive.com',
                           'f1kya092dn@wywnxa.com',
                           'okuayn9qun@zvvzuv.com',
                           'ewlei5dkzx@wywnxa.com',
                           'd2k757ioht@qacmjeq.com',
                           'd10n2cj1wu@knmcadibav.com',
                           'ojbyrm601a@qacmjeq.com',
                           'kkp6i3jocb@qzueos.com',
                           'wsndvby6zd@wywnxa.com',
                           'b1ie0tb06l@gonetor.com',
                           'e424cdklb5@somelora.com',
                           'yh0wkss26l@wywnxa.com',
                           '599fxcvx25@gonetor.com',
                           'eglwedp7uk@somelora.com',
                           '2mq27v013q@vvatxiy.com',
                           'yjermfpjp0@smykwb.com',
                           '3j5wejdn96@qacmjeq.com',
                           'f2rfcvpwhs@tidissajiiu.com',
                           'kwme7mtorj@qzueos.com',
                           'ljvinw1obn@tippabble.com',
                           '8gwc1xcidn@smykwb.com',
                           'bkp3iqfrmq@zvvzuv.com',
                           'jknthk7sy8@tippabble.com',
                           'meroz7t2r5@wywnxa.com',
                           'qyv1g6exej@dygovil.com',
                           '835cb9kkmf@vafyxh.com',
                           'hpig7kxtwb@qacmjeq.com',
                           '2sk20log37@zvvzuv.com',
                           'wuynbxsu60@smykwb.com',
                           '223jawo416@zlorkun.com',
                           '2hkmiamc69@vvatxiy.com',
                           'dju1v47se9@knmcadibav.com',
                           'ut4zy05ts1@vvatxiy.com',
                           'syh4hflcl2@somelora.com',
                           't4i03o22z7@wywnxa.com',
                           'w8azdtc1b7@qejjyl.com',
                           'a03r9yq4ug@qacmjeq.com',
                           'w5lgduth4c@knmcadibav.com',
                           '4wkhe9j3z3@qejjyl.com',
                           '76sbuigvak@smykwb.com',
                           '4ilhky336c@rfcdrive.com',
                           '2r57gjp28s@zlorkun.com',
                           'r3owyd1ahb@tidissajiiu.com',
                           'sye1ylu78o@dygovil.com',
                           '6cpcczloq3@somelora.com',
                           'osrs3khasf@gonetor.com',
                           'jsvuw9sp8s@smykwb.com',
                           'mzdxmua8pn@somelora.com',
                           '56oo3zai8u@rfcdrive.com',
                           '5ai98tcnn1@zlorkun.com',
                           '3vakkh1cex@tippabble.com',
                           'rg19n7u4km@knmcadibav.com',
                           '9itasic1iv@zlorkun.com',
                           'jt8or9qdgj@gonetor.com',
                           'qi7v9v00q6@dygovil.com',
                           'r0fgila4w6@smykwb.com',
                           'xsxvmimhq8@dygovil.com',
                           'u6i3j2hqv6@dygovil.com',
                           'zjf3xcaq52@qacmjeq.com',
                           't9pts9qr5c@knmcadibav.com',
                           'y13zy00av6@zlorkun.com',
                           'e464fozx7g@tidissajiiu.com',
                           'ku8gpoq4kp@qacmjeq.com',
                           'a3urychbsb@zvvzuv.com',
                           'dwhzojrocu@bltiwd.com',
                           '3fenfo27jo@tippabble.com',
                           '3wpl4z854v@vvatxiy.com',
                           'vqletki19u@qacmjeq.com',
                           'd6uinjmjll@qzueos.com',
                           '91c0osd6b3@smykwb.com',
                           'o4hdwg5cfv@gonetor.com',
                           'r6al8pswc2@smykwb.com',
                           'j0rnrlfwbc@vafyxh.com',
                           'fco84maghv@gonetor.com',
                           'jr6ozoyis7@smykwb.com',
                           '81lscw7o99@knmcadibav.com',
                           'rw20t1s5r0@zvvzuv.com',
                           '7jkhmsd5j6@smykwb.com',
                           '9exovqrpjh@qejjyl.com',
                           '1a1bootnow@zvvzuv.com',
                           'eol9u5pxm6@vvatxiy.com',
                           'jd2vzrb76f@vvatxiy.com',
                           '7v4qh53194@dygovil.com',
                           'ucwa8w3j54@somelora.com',
                           'mcg2gr8zfa@zvvzuv.com',
                           'qbt47tirsi@qacmjeq.com',
                           'c0x6wvfyez@vafyxh.com',
                           'fa2hpag957@tippabble.com',
                           'cop1ysjdl9@tippabble.com',
                           '423ys7shr5@tidissajiiu.com',
                           'lefrbrugqi@vafyxh.com',
                           'zqmx6wo2ze@tidissajiiu.com',
                           'buzdyouuxv@knmcadibav.com',
                           'h9ngtua6in@qzueos.com',
                           'wcmybr0g04@somelora.com',
                           'rkk2k2l57x@vvatxiy.com',
                           'qfl0erhp8y@bltiwd.com',
                           '3da7x9wirq@smykwb.com',
                           '5480mk3skt@zlorkun.com',
                           '8ysy0qh67s@rfcdrive.com',
                           'zml20zjti7@dygovil.com',
                           'wc0xpdmhbv@qacmjeq.com',
                           'ytfg4lj8f6@gonetor.com',
                           'fvp35d74e9@zlorkun.com',
                           '23yovhmrlx@qejjyl.com',
                           '7h3itnm2dn@smykwb.com',
                           'dwl40ocnsx@tidissajiiu.com',
                           '4xhtqvi6hq@zvvzuv.com',
                           'kl2nz754kq@rfcdrive.com',
                           '6iiy20907c@rfcdrive.com',
                           '2ipidgaxmg@somelora.com',
                           'vw012y1aba@dygovil.com',
                           'xkalej625a@gonetor.com',
                           'defd3816lg@tippabble.com',
                           'nmb47urlti@smykwb.com',
                           'bi1z2vs5zs@knmcadibav.com',
                           '7lmkygesj9@smykwb.com',
                           'qpq9zwt6rh@tippabble.com',
                           'mes03unois@zlorkun.com',
                           'v6s5tk20h4@smykwb.com',
                           'lc9ake4uun@rfcdrive.com',
                           'gh2g7bauiw@zvvzuv.com',
                           '7ur6u69bl2@qacmjeq.com',
                           '3dxerqw5of@gonetor.com',
                           'uhbvot9im1@rfcdrive.com',
                           'pfb5cw0fp0@somelora.com',
                           'rz7ur2ujh1@vvatxiy.com',
                           'vg13ah6tsa@rfcdrive.com',
                           'dyleoj5465@gonetor.com',
                           'wv115lxygp@zvvzuv.com',
                           '3b6uk6ajx4@gonetor.com',
                           'mdyx3rcldb@rfcdrive.com',
                           'mdd97dcgl9@zlorkun.com',
                           '9ke2qcn104@qacmjeq.com',
                           '9lsonx1m6k@rfcdrive.com',
                           'e8xqhfrv66@qacmjeq.com',
                           'vxu45u2442@knmcadibav.com',
                           'ae9ki4o9wg@dygovil.com',
                           'cyjo2i9nv3@zvvzuv.com',
                           'uoh5z646n8@knmcadibav.com',
                           'hppyh5mnyb@qacmjeq.com',
                           'fz2ybeft20@qacmjeq.com',
                           'mhv0o30eju@tidissajiiu.com',
                           '2o4nsayn67@smykwb.com',
                           '011slgp8m5@tidissajiiu.com',
                           'd3yo508khz@vvatxiy.com',
                           'cib7xhx5ml@vvatxiy.com',
                           'oelrmxtbyg@tidissajiiu.com',
                           'emdnc0avnl@vvatxiy.com',
                           'tqkijmnffa@vvatxiy.com',
                           '4gbddyinoe@somelora.com',
                           'jv2jnt35n0@knmcadibav.com',
                           'o5m0fmmsu1@dygovil.com',
                           'hjh27xzf1k@vvatxiy.com',
                           '99h4j6evwc@bltiwd.com',
                           '4btx0lrs7j@vvatxiy.com',
                           'pxz7tpxcyi@smykwb.com',
                           '4pkjs1e0fg@vvatxiy.com',
                           'k1eoizpxci@zlorkun.com',
                           'yndvgqr3p2@qejjyl.com',
                           'y42l1kfra4@tidissajiiu.com',
                           '3j5rz1tonz@zlorkun.com',
                           'wamu02l9ne@bltiwd.com',
                           '529zqjyw0p@zvvzuv.com',
                           'fqypcpmnjb@qejjyl.com',
                           'l4w2cn3o4b@tidissajiiu.com',
                           'j1rup6hogg@qzueos.com',
                           'f5estaauuu@dygovil.com',
                           'ok3u466c4g@vafyxh.com',
                           'voa76lz4w8@tippabble.com',
                           '8sfn3wavsv@dygovil.com',
                           'bhncsmma3g@tidissajiiu.com',
                           '5kj460s4go@zlorkun.com',
                           'f0bvhqb2nc@knmcadibav.com',
                           'q953dadwwu@bltiwd.com',
                           '4jkelkon9v@tippabble.com',
                           'de7t9tn0kc@tidissajiiu.com',
                           'u5b0owtcja@vvatxiy.com',
                           'dc95t15wjj@bltiwd.com',
                           'e53rl6w839@tidissajiiu.com',
                           'kl8qw5tcch@vafyxh.com',
                           'x9qqnyjuzp@qacmjeq.com',
                           't9sx7nt2tn@tidissajiiu.com',
                           'x39kcdgkxu@wywnxa.com',
                           'arwu1ps9fo@qacmjeq.com',
                           'ijn5tda50x@tidissajiiu.com',
                           'pa6za82n61@tidissajiiu.com',
                           'pvou1u7kik@vafyxh.com',
                           'i0yg2kfyce@somelora.com',
                           '2dg32us9s0@tidissajiiu.com',
                           'bkgwhkecow@qzueos.com',
                           'zxe7zsttj6@qacmjeq.com',
                           '8rpefj8ugr@knmcadibav.com',
                           '485o3gxpxh@vafyxh.com',
                           'bzapqr2fv3@rfcdrive.com',
                           'nszihjnoet@qacmjeq.com',
                           'ryi68egec4@zlorkun.com',
                           'sllexbmg0q@smykwb.com',
                           '3dblck4zfo@zvvzuv.com',
                           '7fq3z6zu3j@zvvzuv.com',
                           'j435zqi3j5@tippabble.com',
                           '236t5lmyp9@tippabble.com',
                           'k4huabd2bi@vvatxiy.com',
                           'hsl244w89u@wywnxa.com',
                           'z0imysrk0t@smykwb.com',
                           'zzud4zjt2m@zlorkun.com',
                           'ee6jz5b70c@vafyxh.com',
                           'jdt3kkb0s3@knmcadibav.com',
                           'km0i33fvaa@vvatxiy.com',
                           'yab4rv276g@gonetor.com',
                           'veniaminalekseev2066@list.ru',
                           'wvzfnkeizs@dygovil.com',
                           'yvw94xb3qy@rfcdrive.com',
                           'r9kj08sl97@tidissajiiu.com',
                           '00cj4mvkg8@zlorkun.com',
                           'dwppkegtnp@qacmjeq.com',
                           'sx434bzky6@smykwb.com',
                           'rptj9cz0as@tippabble.com',
                           'bl1bets3uz@somelora.com',
                           '7g8a4gbfgs@wywnxa.com',
                           'v7p43o310m@knmcadibav.com',
                           '3socagt80b@qacmjeq.com',
                           '7vpaz5z37h@smykwb.com',
                           'wtrn07rk4w@smykwb.com',
                           'fcbjway91z@tidissajiiu.com',
                           'c95lfv381y@tidissajiiu.com',
                           'yu0qztdxyb@dygovil.com',
                           'd26mrscyt2@zvvzuv.com',
                           'hnsshcqcjh@zlorkun.com',
                           'ymcymn90dx@vafyxh.com',
                           'yonkvd0hcy@qzueos.com',
                           'g14d0pmha6@qejjyl.com',
                           'lu165l5v1b@somelora.com',
                           'vicoya5490@ofionk.com',
                           '4xyhpycv84@tippabble.com',
                           'cwex03596c@smykwb.com',
                           'x1p2ybpdjq@bltiwd.com',
                           '7ou5cs5u75@qejjyl.com',
                           'qdzxy1jlqv@tippabble.com',
                           'h6nf2g4puz@qacmjeq.com',
                           'cnlss6o3cm@tippabble.com',
                           'nwib5kozl7@tidissajiiu.com',
                           '7ajh1tgd5e@zvvzuv.com',
                           'q3pzsr12wo@rfcdrive.com',
                           '10p816s5y8@zlorkun.com',
                           'fo9vzwxzfc@smykwb.com',
                           'ibqzni77gz@somelora.com',
                           'xeihehmjdw@dygovil.com',
                           '8ks5vu708p@wywnxa.com',
                           'od70h70a5b@gonetor.com',
                           '7283vjj28w@somelora.com',
                           'cwfkr3cxdz@vvatxiy.com',
                           'raye95n0golom@list.ru',
                           'ssk1cgpwyo@somelora.com',
                           'l35d35e8vd@qejjyl.com',
                           '81dba3szot@knmcadibav.com',
                           'fxgcqg0km8@dygovil.com',
                           '58r1g7w4ec@vafyxh.com',
                           's4ymet0h5n@smykwb.com',
                           '65almuytd1@rfcdrive.com',
                           '0tmpz6xgav@qejjyl.com',
                           '2l8ovk1s3d@qzueos.com',
                           'jhv6xz055c@wywnxa.com',
                           'cmh4m0o0rv@rfcdrive.com',
                           '0mqodzh5bc@qzueos.com',
                           'okih9pwsho@qejjyl.com',
                           '5l1wb7k2uu@knmcadibav.com',
                           'dhph1o5u7o@zvvzuv.com',
                           'py6i7c8uxd@somelora.com',
                           'dyayll9rm6@rfcdrive.com',
                           'phogefi99w@tidissajiiu.com',
                           'uyxp7bi6r8@vafyxh.com',
                           'vahagngalanichev1985@list.ru',
                           'qdwy3brye4@vvatxiy.com',
                           '8avpy1v0xe@somelora.com',
                           '8iygts0zdk@vafyxh.com',
                           'csiqojqs1m@zvvzuv.com',
                           'eglf3t9a84@gonetor.com',
                           'qbcyfebkqv@smykwb.com',
                           'k86tbe9ue7@qejjyl.com',
                           '6ysk0tgbxa@zvvzuv.com',
                           '8lmx9h17wa@vafyxh.com',
                           '8nvd43hzgl@qejjyl.com',
                           'dfs11r4jfb@gonetor.com',
                           '8zz9oqj7rj@gonetor.com',
                           'gm0ncycg8y@tippabble.com',
                           'cp46039kw4@smykwb.com',
                           'g2sgzyownb@somelora.com',
                           'h52c4q4qz4@tidissajiiu.com',
                           '8261pmfx6b@tidissajiiu.com',
                           '85kj4zd8ud@zlorkun.com',
                           'iicd5u3bej@dygovil.com',
                           '1yprrpa563@qzueos.com',
                           'z9di9iv2cv@tidissajiiu.com',
                           '7jr11an8qd@somelora.com',
                           'h64g9uf27p@bltiwd.com',
                           '1rt17bo53t@wywnxa.com',
                           '781gundhfo@zlorkun.com',
                           '3lk0062o7w@tidissajiiu.com',
                           'kt0rsbwtg2@vvatxiy.com',
                           'dtzrg9u77r@rfcdrive.com',
                           '5422prcmv1@qacmjeq.com',
                           '1c0cvvj087@tippabble.com',
                           'tm37rcnpxp@somelora.com',
                           'sxsf4tamem@tidissajiiu.com',
                           '8pxmy68qna@qacmjeq.com',
                           'l98mnbwczg@tippabble.com',
                           'lhqmjzmgl3@qejjyl.com',
                           '01kt5kx5zf@qacmjeq.com',
                           'dbqcw5luif@dygovil.com',
                           'r5d3jb6obm@knmcadibav.com',
                           'qvmhmuc4k0@vafyxh.com',
                           'mr5cxop71h@qejjyl.com',
                           'pt61787hbs@qzueos.com',
                           'ldr7gi4riu@tippabble.com',
                           'lvxlfqdxh@emlpro.com',
                           '0gx2ddyu1b@bltiwd.com',
                           'qrm4t6ij3i@vafyxh.com',
                           '4aenegufia@zvvzuv.com',
                           'n7e8oigjtm@tidissajiiu.com',
                           'qyh21t1rvp@knmcadibav.com',
                           'tmvwu5v4kt@qacmjeq.com',
                           '04cvmwvd9r@freeml.net',
                           '2st927fy86@dygovil.com',
                           'ahjkem8ogq@vvatxiy.com',
                           'agdahqesknxufu@dropmail.me',
                           'y0lzgmdx9w@vvatxiy.com',
                           'l8ghrfoblp@bltiwd.com',
                           '97e3muw3ve@somelora.com',
                           'hfeuecngg@laste.ml',
                           'b6o50ws90u@tidissajiiu.com',
                           'wu303t0n6e@knmcadibav.com',
                           'ass3yvb8jm@bltiwd.com',
                           'qh052gho0c@zvvzuv.com',
                           '1xtc5f8u65@tippabble.com',
                           'agookwtpx@yomail.info',
                           'ytczrfbmcc@smykwb.com',
                           'lr8cfxjaod@tippabble.com',
                           '3cj5ogah2c@somelora.com',
                           'x3fn4z1z@flymail.tk',
                           'oi586lj1q2@dygovil.com',
                           'lxwjajp6go@qzueos.com',
                           'qtzg9ik7o1@knmcadibav.com',
                           'kowesek0gis2@10mail.xyz',
                           'klqwis55on@dygovil.com',
                           'agoowayem@yomail.info',
                           'sqarmx4pw9@gonetor.com',
                           '0dymghbjui@rfcdrive.com',
                           'l1k0tam0dik3@10mail.xyz',
                           'zghneo78x2@qzueos.com',
                           'ukf9u9xddf@rfcdrive.com',
                           'ludislavazakrevskaya1995@list.ru',
                           'agdabnerjvoawp@dropmail.me',
                           '83j3b82du9@somelora.com',
                           'mmdfhmwa0v@zvvzuv.com',
                           'x28rc06v@flymail.tk',
                           'ylcs7ewx5h@zlorkun.com',
                           'a5gh9vhmy4@vvatxiy.com',
                           '0431371yzg@spymail.one',
                           'jivkojod89@qejjyl.com',
                           '5i5d91ia04@gonetor.com',
                           'g8nes7j1t8@gonetor.com',
                           'agophgnac@yomail.info',
                           '6ymowyyquu@somelora.com',
                           'x3pkt4zd@flymail.tk',
                           'mdmfyvbxh@emlpro.com',
                           '23don3ku08@qacmjeq.com',
                           'zmeghmbyi@emltmp.com',
                           'p7kyi0d9ds@zvvzuv.com',
                           'low0suj1gig2@10mail.xyz',
                           'aye96uyt9s@zvvzuv.com',
                           'agokftlqx@yomail.info',
                           'ffcbbrogg@laste.ml',
                           'rqkulfcxh@emlpro.com',
                           'x3va7trs@flymail.tk',
                           'fd4q1dxzjd@smykwb.com',
                           '7dizcjxczp@vafyxh.com',
                           'zlzmuvogg@laste.ml',
                           'itfylhxxi@emltmp.com',
                           'x3wjpm3r@flymail.tk',
                           'agorpadib@yomail.info',
                           '7tlclko502@knmcadibav.com',
                           'e4hw1gxht2@vvatxiy.com',
                           'agdfdvjuaskxqb@dropmail.me',
                           'bmy75nt270@somelora.com',
                           'ezt838rzw1@dygovil.com',
                           'hpe1zps7om@zlorkun.com',
                           'pan1k0n0mum2@10mail.xyz',
                           'jj7oj8am6t@bltiwd.com',
                           'rcbxja4u65@qejjyl.com',
                           'ntrnkapgg@laste.ml',
                           'hwuywz770t@knmcadibav.com',
                           'ahfuffbgb@10mail.org',
                           'dayantin@rambler.ru',
                           'bepahuwuhen2@10mail.xyz',
                           'k0zlcpuldx@knmcadibav.com',
                           'xjnq4nfa@minimail.gq',
                           'kwoba51qhf@tippabble.com',
                           '4ewa9upd3z@wywnxa.com',
                           '04czjy5g20@freeml.net',
                           'eiabsu8hql@somelora.com',
                           '04cy9rxe4c@freeml.net',
                           '04cyb3dxfm@freeml.net',
                           '0divz9mnjt@zlorkun.com',
                           'hswifwcuh@emlhub.com',
                           'r0pp3cas3f@qejjyl.com',
                           'v9818yw1v7@vvatxiy.com',
                           '0437xswv74@spymail.one',
                           'sxwdavcxh@emlpro.com',
                           'erdeliavedana1994@list.ru',
                           'ahfuronmd@10mail.org',
                           'evi901o44e@smykwb.com',
                           '5aenoofyww@tippabble.com',
                           's44ds9iisy@tidissajiiu.com',
                           'e2fv21kb0r@qejjyl.com',
                           '9jrodc7fmc@bltiwd.com',
                           '6is0g943xs@tidissajiiu.com',
                           'qsjwesuq1b@vvatxiy.com',
                           'g8ea92804p@zvvzuv.com',
                           'wcx3r78bab@somelora.com',
                           'kmjvj3z4xk@gonetor.com',
                           'edz3ha5a0z@zlorkun.com',
                           '5t9dsfc5h6@somelora.com',
                           'xs0mfultqs@rfcdrive.com',
                           'tllqdy8uni@smykwb.com',
                           '9yv46tddd6@smykwb.com',
                           'whpf6z77tb@gonetor.com',
                           'ursulawenckc4@list.ru',
                           'nz2bay58k0@rfcdrive.com',
                           'nkuyl9v818@wywnxa.com',
                           'nzc9uu8288@tidissajiiu.com',
                           'u5bx2u72ry@smykwb.com',
                           'njaj2smriz@tippabble.com',
                           'amoslavrentev1962@list.ru',
                           'alzgwdn4lz@somelora.com',
                           'thn7fr2n7y@tidissajiiu.com',
                           'f1p4ualuuo@vafyxh.com',
                           '98ptmps72f@smykwb.com',
                           'p1qro2rsib@smykwb.com',
                           'ufd0bhgx22@zlorkun.com',
                           'umo3sareva@rfcdrive.com',
                           'xq8fzvjlv5@vvatxiy.com',
                           'kk4meqx2kt@rfcdrive.com',
                           '22lczfkgrj@qzueos.com',
                           'l0b5h133lr@gonetor.com',
                           'jz99aoy79b@somelora.com',
                           'v667uv76ru@tippabble.com',
                           'me92fjk018@somelora.com',
                           'rllb1przgj@vafyxh.com',
                           'r4viuv4ar3@zlorkun.com',
                           'jx7gd5m8si@tippabble.com',
                           '4z3n57igvw@rfcdrive.com',
                           'zntgwcojdp@qzueos.com',
                           '2vz0zsq23e@bltiwd.com',
                           'yy26sdnbpm@qacmjeq.com',
                           '3r84mpiwzn@tidissajiiu.com',
                           'ayr3h6u80i@qzueos.com',
                           '18gur9s1q3@vafyxh.com',
                           '382l9ckuzy@knmcadibav.com',
                           '5q1oum9cdm@qejjyl.com',
                           'l7xg91t9nx@gonetor.com',
                           'gy97l80ejf@vafyxh.com',
                           'x5pfgwz4b7@bltiwd.com',
                           '4xrxbg0lco@wywnxa.com',
                           'iiowmyplg3@qzueos.com',
                           '7zyvvrgm67@qzueos.com',
                           'q54llfgg7t@qejjyl.com',
                           'jdx2dfy20r@tidissajiiu.com',
                           'q4hetelh75@bltiwd.com',
                           'u1my3qbkli@bltiwd.com',
                           'xbxyoo0sf9@rfcdrive.com',
                           'b3r7l273f8@qacmjeq.com',
                           '0iwbmqexcd@bltiwd.com',
                           's4d32bvbcq@rfcdrive.com',
                           'uegl3ezmhb@zlorkun.com',
                           'cnk5e7mo3n@rfcdrive.com',
                           'yc8l30enwr@rfcdrive.com',
                           '171ym63twp@knmcadibav.com',
                           'pf5hx1yajv@vafyxh.com',
                           'ad8z41dscf@gonetor.com',
                           'ky0fxtd27e@qejjyl.com',
                           '8obfh013pe@zvvzuv.com',
                           'qgi2gxzisn@tidissajiiu.com',
                           '00qamvqkf8@smykwb.com',
                           'q7abtwryd6@knmcadibav.com',
                           'wysztywl3k@rfcdrive.com',
                           'eanmz4gh8d@vafyxh.com',
                           'uiv4kus9go@zvvzuv.com',
                           'ijr5bj0mvk@qejjyl.com',
                           '7ua256fjvg@rfcdrive.com',
                           'l9s9pgh1sf@qzueos.com',
                           'mjppapp8wo@somelora.com',
                           'dnxcccw8r5@somelora.com',
                           '8ilv7qe72d@tidissajiiu.com',
                           'yz6l143tgp@tippabble.com',
                           'y0teqij0cy@dygovil.com',
                           'nyz9yxxu25@rfcdrive.com',
                           'ttvttxmep6@wywnxa.com',
                           'sbzuoc2bw4@qzueos.com',
                           'dtntd5qxuz@qacmjeq.com',
                           '94saq2rt2r@tippabble.com',
                           'm0u42ujha0@somelora.com',
                           '01t1ktc7bg@dygovil.com',
                           '9897nbnxfz@zlorkun.com',
                           '6i06pntpro@rfcdrive.com',
                           '1j6n5ujne5@vvatxiy.com',
                           'b9yv1epdig@smykwb.com',
                           'ex65zt42fn@qacmjeq.com',
                           '08qpywe2yy@smykwb.com',
                           'hyfy9fhygk@qacmjeq.com',
                           'vcx7w6bijr@vafyxh.com',
                           'gzc1prdje2@bltiwd.com',
                           '17huxtnise@vafyxh.com',
                           'mmxuwisutkvmu@list.ru',
                           '2v18lpq98o@smykwb.com',
                           'r2rrb3e9d1@qacmjeq.com',
                           'bkrpmo0vuu@tidissajiiu.com',
                           'hexluw65ge@tippabble.com',
                           'mgnqkveyi@emltmp.com',
                           'agdepqbubdrrkw@dropmail.me',
                           '8ahns6no92@qzueos.com',
                           'aprdixeyi@emltmp.com',
                           'agderflaagbabg@dropmail.me',
                           'ilariimyasnikov5877@list.ru',
                           'xk5kzyae@minimail.gq',
                           'olg9z02mpi@vafyxh.com',
                           'ahfxsgoff@10mail.org',
                           'vqn5i1kaux@somelora.com',
                           'agotsxzhx@yomail.info',
                           '3kv86gvv0o@qacmjeq.com',
                           'agottfaoi@yomail.info',
                           'iwymzjxh18@gonetor.com',
                           'ndxassfuh@emlhub.com',
                           '46typi75ov@zvvzuv.com',
                           'tydektfuh@emlhub.com',
                           '043dnzcng8@spymail.one',
                           '45mfea8e9w@vafyxh.com',
                           'tatianshiryaev9912@list.ru',
                           'rxpufrfxh@emlpro.com',
                           'asv4paipfj@vvatxiy.com',
                           '04d1sh7v3g@freeml.net',
                           'kvrcy18tkv@vafyxh.com',
                           'ranbjwfuh@emlhub.com',
                           'vw1i88g0k9@zvvzuv.com',
                           'afktcxfuh@emlhub.com',
                           '04d1wxm0gm@freeml.net',
                           'netimeni.98@yandex.ru',
                           'dutuzodykeh2@10mail.xyz',
                           '043ef5w65r@spymail.one',
                           'x4wgwt4c@flymail.tk',
                           'f430k98wti@tidissajiiu.com',
                           'gyjvbaa94c@qejjyl.com',
                           '7bbiiaskg9@tippabble.com',
                           '9iuwsdhaw9@dygovil.com',
                           'tjp4hg8g6y@tippabble.com',
                           'cbvtydlftz@bltiwd.com',
                           'vovtwlkoh6@knmcadibav.com',
                           'ad3gn08kln@wywnxa.com',
                           '4v554767rx@zvvzuv.com',
                           '4894mzznci@vafyxh.com',
                           'eetq6o9iqi@dygovil.com',
                           '15fkqeukqm@wywnxa.com',
                           'pirz86bxi1@zvvzuv.com',
                           'f1x189ncow@knmcadibav.com',
                           'fuzywato@teleg.eu',
                           '2f9zl1tbnr@somelora.com',
                           'dve0icukbn@somelora.com',
                           '2dmnzw60gw@wywnxa.com',
                           'mk81808icq@vvatxiy.com',
                           '71bv9gekfw@qzueos.com',
                           '43jboc6mfs@wywnxa.com',
                           '9elk0ejrlh@tidissajiiu.com',
                           'j757o0vkuh@knmcadibav.com',
                           'ryl1m4jr2p@knmcadibav.com',
                           'taweni7313@cetnob.com',
                           '0n44zy9y4l@vafyxh.com',
                           '4m9bihyocm@vvatxiy.com',
                           'ahbpq0yve4@qzueos.com',
                           '252koa9zba@rfcdrive.com',
                           'w0izxigj8r@somelora.com',
                           'kohap51670@cetnob.com',
                           '3gwi41og54@tippabble.com',
                           '0cnudofhfi@zvvzuv.com',
                           'gevemo4063@degcos.com',
                           'vojer15532@degcos.com',
                           'xnj2j1f05a@somelora.com',
                           'e1imx506db@vafyxh.com',
                           'toxay49177@ofionk.com',
                           'yawahe7862@heweek.com',
                           'c3dbcbxvv1@qacmjeq.com',
                           'pomape8891@ofionk.com',
                           '8vgpghlnk1@qejjyl.com',
                           'irisha210692@mail.ru',
                           'fixeto5134@asaud.com',
                           'disis71687@marchub.com',
                           'ct5tg0hu8f@rfcdrive.com',
                           'nonab29396@heweek.com',
                           'mopin51795@marchub.com',
                           'rafihit752@asaud.com',
                           'dma-2a@mail.ru',
                           'df5trhnnfh@dygovil.com',
                           'megog71980@ofionk.com',
                           'l5oa2ng26k@vafyxh.com',
                           'leleta7994@ofionk.com',
                           'rilojop748@cetnob.com',
                           'zateevaolga617@gmail.com',
                           'dq6lcfxy4o@bltiwd.com',
                           'xeyaki6087@marchub.com',
                           'zx6e0q2gv7@bltiwd.com',
                           'naheri9212@nastyx.com',
                           '06xgxnvxgm@qzueos.com',
                           'wafixe5637@ofionk.com',
                           'jopec54080@asaud.com',
                           'g2op9hiyg8@somelora.com',
                           'gofix28038@marchub.com',
                           'annzakaruan@gmail.com',
                           'ua75mu2kza@smykwb.com',
                           'hodabo9264@sigmazon.com',
                           'katya1393@mail.ru',
                           'ekaterina_tsareva-2012@mail.ru',
                           'elena_r76@mail.ru',
                           'maksimpokupki2513@gmail.com',
                           'pozdnoksana@yandex.ru',
                           'evgenia8907@mail.ru',
                           'zavadskaya06@mail.ru',
                           'lisan.3130092gmail.com@mail.ru',
                           'olesyaoe@mail.ru',
                           'popovaangelina08@gmail.com',
                           'nataliya.07@mail.ru',
                           'k.kozitsina@gmail.com',
                           'e777xx@mail.ru',
                           'efremovadaria3108@gmail.com',
                           'nysha88@mail.ru',
                           'khushi.shinn@openmail.pro',
                           'lealan.bonneau@solarnyx.com',
                           'elainey.holmes@horizonspost.com',
                           'chisch2534@solarnyx.com',
                           '8jaro5781@allfreemail.net',
                           'anagul4167@allfreemail.net',
                           'nikkii.zink@solarnyx.com',
                           'tahjanee.foulds@allfreemail.net',
                           'gearald.lockman@allfreemail.net',
                           'saavan.bloxham@solarnyx.com',
                           'dusin.deforest@allfreemail.net',
                           'konur.swihart@allfreemail.net',
                           'payslie.sabia@solarnyx.com',
                           'jamii.thiem@allfreemail.net',
                           'shavonda.mcavoy@allfreemail.net',
                           'jarely.basham@solarnyx.com',
                           'ahfyiymho@10mail.org',
                           'dqetzsfyi@emltmp.com',
                           'marianna.yefremova12@mail.ru',
                           'agoakvuro@yomail.info',
                           'tuneddavasso-3506@yopmail.com',
                           'suttifeufreulla-1942@yopmail.com',
                           'sezecroullauli-5684@yopmail.com',
                           'rutaprofrollou-6745@yopmail.com',
                           'youllummullixu-6962@yopmail.com',
                           'bapebixawou-5034@yopmail.com',
                           'grammoppeumogra-9374@yopmail.com',
                           'rececaruce-8624@yopmail.com',
                           'yemoucriceba-1524@yopmail.com',
                           's40923779@gmail.com',
                           'wuquesequifou-4993@yopmail.com',
                           'hautaugeuhuveu-4727@yopmail.com',
                           'kemmezeyemmo-1374@yopmail.com',
                           'jepriprouttoupa-6020@yopmail.com',
                           'pralliffallatrou-7301@yopmail.com',
                           'goutocrafafre-3797@yopmail.com',
                           'hupragitroze-2193@yopmail.com',
                           'zeummefraucanu-7529@yopmail.com',
                           'trafegougauffe-6494@yopmail.com',
                           'treixeumminnoime-7416@yopmail.com',
                           'fajitouyallu-1610@yopmail.com',
                           'fazoineffallo-5228@yopmail.com',
                           'brammuffiprotteu-1700@yopmail.com',
                           'chess1234tam@yandex.ru',
                           'vabredahafoi-4945@yopmail.com',
                           'doicoppaudopro-4601@yopmail.com',
                           'lusiquozessa-4569@yopmail.com',
                           'lidduddunnefo-6701@yopmail.com',
                           'dinnoigepappa-9896@yopmail.com',
                           'yanisseissoilu-5443@yopmail.com',
                           'soureulafeca-4810@yopmail.com',
                           'douffeufrawoifro-5032@yopmail.com',
                           'koufrawuttayo-1603@yopmail.com',
                           'soihufroucitre-7110@yopmail.com',
                           'addresses322@gmail.com',
                           'vizauquoprerou-8795@yopmail.com',
                           'fabessopreffu-1814@yopmail.com',
                           'annalytovaofficial@yandex.ru',
                           'teikamoxeuna-3159@yopmail.com',
                           'trekonnukoyau-8201@yopmail.com',
                           'fuffollujeuzeu-1469@yopmail.com',
                           'kirahubreisa-4043@yopmail.com',
                           'happeirunollu-8220@yopmail.com',
                           'elinapanchenko80@gmail.com',
                           'rinnohuttoitreu-5265@yopmail.com',
                           'hajittakogre-3377@yopmail.com',
                           'xettaugreuvatta-8693@yopmail.com',
                           'radanneinnexeu-9824@yopmail.com',
                           'lerazajceva2412@gmail.com',
                           'wuponugrivo-2874@yopmail.com',
                           'yoixeillafeuvu-6423@yopmail.com',
                           'yamiseritrou-4203@yopmail.com',
                           'zoubrixappotra-5229@yopmail.com',
                           'rozugrocrizei-2704@yopmail.com',
                           'youzukanaddi-7826@yopmail.com',
                           'kocoweihoufre-7299@yopmail.com',
                           'jelounnanate-2155@yopmail.com',
                           'yalennemala-2733@yopmail.com',
                           'tipraffequouque-4522@yopmail.com',
                           'weuprelapesse-8939@yopmail.com',
                           'dibrotteillaufo-9337@yopmail.com',
                           'gotauddoicraku-1082@yopmail.com',
                           'xejoddufeddeu-7152@yopmail.com',
                           'fraddumeinnapre-3817@yopmail.com',
                           'yecauzeppecru-5521@yopmail.com',
                           'nifrefettosau-1747@yopmail.com',
                           'toufreuheuviddau-3190@yopmail.com',
                           'mawatrappatri-4513@yopmail.com',
                           'cebilleyepa-6613@yopmail.com',
                           'beizoyaujatta-6240@yopmail.com',
                           'crigussediffau-9736@yopmail.com',
                           'zejucraudizoi-1415@yopmail.com',
                           'zeuboucruxippu-4646@yopmail.com',
                           'vauneiloiddauwei-5398@yopmail.com',
                           'zipevutraxo-6805@yopmail.com',
                           'proweigrulouffoi-2415@yopmail.com',
                           'toubakodessu-8876@yopmail.com',
                           'queicapiseiyeu-4998@yopmail.com',
                           'woitagauyeiqui-7269@yopmail.com',
                           'bromouddoissommo-6371@yopmail.com',
                           'wauquegocregra-9426@yopmail.com',
                           'bulatova_on@bk.ru',
                           'dacassoigeuwou-1209@yopmail.com',
                           'rassullassemo-4368@yopmail.com',
                           'craproitreteti-3993@yopmail.com',
                           'soutrussoirudde-3815@yopmail.com',
                           'froppaxousucei-1581@yopmail.com',
                           'quafizennela-9847@yopmail.com',
                           'sutexeiyuna-8796@yopmail.com',
                           'woteiwouxouve-4809@yopmail.com',
                           'treudoceyutta-2714@yopmail.com',
                           'craprisellacoi-4260@yopmail.com',
                           'bregeiquoicatta-9546@yopmail.com',
                           'quinnebrayaprau-6530@yopmail.com',
                           'veibririloyou-8916@yopmail.com',
                           'keumakallittu-3092@yopmail.com',
                           'gauprussepanoi-8442@yopmail.com',
                           'galleuzeuroike-7390@yopmail.com',
                           'trarauppocappau-1084@yopmail.com',
                           'fouttefreifaugrau-9354@yopmail.com',
                           'mapeucreubrara-1201@yopmail.com',
                           'groupedateidda-3480@yopmail.com',
                           'gromayollemmau-7793@yopmail.com',
                           'yeppaceufraya-2921@yopmail.com',
                           'creuddobofrexa-9749@yopmail.com',
                           'gaboihoubillu-4246@yopmail.com',
                           'quenossimeigi-4470@yopmail.com',
                           'seippennoullase-6382@yopmail.com',
                           'migranofreyau-4728@yopmail.com',
                           'yoicralliyagei-9448@yopmail.com',
                           'vususugreque-1086@yopmail.com',
                           'traubauquouraddo-6619@yopmail.com',
                           'sofeiteugupau-6754@yopmail.com',
                           'gufrewedaupo-9945@yopmail.com',
                           'zeitrimmeuyoquei-2641@yopmail.com',
                           'brecaddamimmo-9228@yopmail.com',
                           'brinegrisofe-1709@yopmail.com',
                           'beullebidouna-3512@yopmail.com',
                           'wuyiboyasa-8921@yopmail.com',
                           'wetroullifane-5073@yopmail.com',
                           'feinogrirello-2375@yopmail.com',
                           'ceyoiffedoxo-2708@yopmail.com',
                           'jixoipopessau-3535@yopmail.com',
                           'crafrujoveha-7496@yopmail.com',
                           'pruxaffussiye-8921@yopmail.com',
                           'daffegeyeuyo-2884@yopmail.com',
                           'traboittolougei-5872@yopmail.com',
                           'miceddexoillo-4172@yopmail.com',
                           'lupregruqueimme-6105@yopmail.com',
                           'pumeucrebota-3139@yopmail.com',
                           'troddufroreuhe-2112@yopmail.com',
                           'crufeibrucehoi-1662@yopmail.com',
                           'gauhohagoiju-5821@yopmail.com',
                           'vaquautufreissa-1309@yopmail.com',
                           'alinavrn96@mail.ru',
                           'gestya83@mail.ru',
                           'kifobroittuqueu-3286@yopmail.com',
                           'brareddajipre-8712@yopmail.com',
                           'gregacreuwube-7803@yopmail.com',
                           'proinnaubinugru-2273@yopmail.com',
                           'mecreippipammou-6767@yopmail.com',
                           'potocroihixou-4833@yopmail.com',
                           'quogucinehe-3278@yopmail.com',
                           'dikettogralo-8501@yopmail.com',
                           'bregukemmazau-4161@yopmail.com',
                           'prawonnarouwu-3626@yopmail.com',
                           'teutevassoime-9265@yopmail.com',
                           'fritoppagoirau-5506@yopmail.com',
                           'teunnitouppoupu-1098@yopmail.com'
            )

    `
    return {}
  }

  async createFile(
    path: string,
    fileName: string,
    data: string,
  ): Promise<void> {
    // if (!this.checkIfFileOrDirectoryExists(path)) {
    //   fs.mkdirSync(path);
    // }

    const writeFiles = promisify(writeFile);

    return await writeFiles(`${path}/${fileName}`, data, 'utf8');
  }

  async findManyUsersByName(name: string): Promise<any> {
    return this.dbService.user.findMany({
      take: 10,
      orderBy: {
        videoLikes: {
          _count: 'desc'
        }
      },
      where: {
        name: {
          contains: name
        }
      },
      include: {
        videoLikes: {
          select: {
            id: true,
            video_id: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        }
      }
    })
  }

  async findFirstSongById(id: number): Promise<any> {
    const song = "https://firebasestorage.googleapis.com/v0/b/testing-98cd8.appspot.com/o/images%2F1725226282184?alt=media&token=5c0ccc8f-f8d1-4c65-8385-e21b695de6cb"
    const readStream = createReadStream(song)
    return new StreamableFile(readStream)
    return this.dbService.song.findFirst({
      where: {
        id: id
      }
    })
  }

}
