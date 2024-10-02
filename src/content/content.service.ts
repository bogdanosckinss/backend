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
                           'komissarovahap1970@list.ru',
                           'zhuravlyovahyv1980@list.ru',
                           'savelevaesx1978@list.ru',
                           'zinovevaeet1992@list.ru',
                           'titovadyr1968@list.ru',
                           'maslovahwm1994@list.ru',
                           'vladimirovaskv1978@list.ru',
                           'kiselyovavdr1984@list.ru',
                           'dementevacst1997@list.ru',
                           'xeq3zdk8cv@rteet.com',
                           'kalashnikovarom1987@list.ru',
                           'eliseevacww1992@list.ru',
                           'ignatovamjr1981@list.ru',
                           'kostinahjc1979@list.ru',
                           'knyazevakfu1994@list.ru',
                           'isaevabgk1966@list.ru',
                           'kulakovadia1966@list.ru',
                           'aleksandrovaikw1975@list.ru',
                           'semyonovaejh1990@list.ru',
                           '2e57gp6o3u@dpptd.com',
                           'voronovaubw1979@list.ru',
                           'lobanovavrc1976@list.ru',
                           'arkhipovahcu1990@list.ru',
                           'knyazevahau1978@list.ru',
                           'vlasovavoy1992@list.ru',
                           'gerasimovanvg1986@list.ru',
                           'shashkovacnw1989@list.ru',
                           'shiryaevakjz1985@list.ru',
                           'filatovaqji1976@list.ru',
                           'sysoevaolt1981@list.ru',
                           'abramovayir1989@list.ru',
                           'yakushevatbk1986@list.ru',
                           'filippovamad1988@list.ru',
                           'smirnovaugp1980@list.ru',
                           'safonovaodl1979@list.ru',
                           'mironovadgo1989@list.ru',
                           'andreevavln1978@list.ru',
                           'savelevakvk1993@list.ru',
                           'kudryavtsevawax1969@list.ru',
                           'zhukovalov1987@list.ru',
                           'eliseevantq1997@list.ru',
                           'dorofeevaihc1979@list.ru',
                           'konovalovahwt1986@list.ru',
                           'emelyanovayuy1969@list.ru',
                           'shcherbakovaynj1992@list.ru',
                           'maslovawle1986@list.ru',
                           '9r73tpqwjz@rteet.com',
                           'mukhinakhl1969@list.ru',
                           'kabanovaavs1988@list.ru',
                           'friz100@rambler.ru',
                           'safonovaiwx1988@list.ru',
                           'safonovavdb1984@list.ru',
                           'gordeevaxgy1994@list.ru',
                           'gordeevajwl1981@list.ru',
                           'kharitonovafny1983@list.ru',
                           'kiselyovaeyc1983@list.ru',
                           'trofimovanra1978@list.ru',
                           'filatovavbx1971@list.ru',
                           'margarita@superrito.com',
                           'evdokimovawrf1993@list.ru',
                           'nikiforovabim1977@list.ru',
                           'kuznetsovarhz1980@list.ru',
                           'kalashnikovayhg1983@list.ru',
                           'gromovadyu1970@list.ru',
                           'karpovacdj1967@list.ru',
                           'zhuravlyovahmb1976@list.ru',
                           'q9y65wknxz@rteet.com',
                           'rogovafcc1996@list.ru',
                           'fomichyovawpy1976@list.ru',
                           'sofia@dygovil.com',
                           'kuzminaaea1990@list.ru',
                           'pestovapsm1971@list.ru',
                           'gerasimovascx1967@list.ru',
                           'korolyovatqu1976@list.ru',
                           'vlasovatmm1978@list.ru',
                           'bobrovaned1971@list.ru',
                           'bobrovawzg1978@list.ru',
                           'potapovassd1977@list.ru',
                           'belovayns1983@list.ru',
                           'smirnovasbp1972@list.ru',
                           'ponomaryovauww1995@list.ru',
                           'rusakovauvk1997@list.ru',
                           'pakhomovanlz1978@list.ru',
                           'sidorovaltm1979@list.ru',
                           'dyachkovaelu1997@list.ru',
                           'kulaginafhe1975@list.ru',
                           'tsvetkovaylg1980@list.ru',
                           '3oue0xmyoh@rteet.com',
                           'efimovahnu1988@list.ru',
                           '1pkos6myw8@dpptd.com',
                           'drozdovaxwa1974@list.ru',
                           'rybakovayjh1992@list.ru',
                           'andreevaqln1980@list.ru',
                           'lazarevahfz1966@list.ru',
                           'burovamdi1988@list.ru',
                           'subbotinaiyx1966@list.ru',
                           'sergeevaeip1982@list.ru',
                           'karpovacnn1978@list.ru',
                           'zuevaxgy1971@list.ru',
                           'vinogradovamhr1983@list.ru',
                           'bykovahyb1985@list.ru',
                           'volkovabet1975@list.ru',
                           'teterinajfd1997@list.ru',
                           '7k5sb2iiuk@rteet.com',
                           'koshelevaygu1971@list.ru',
                           'krasilnikovakkf1967@list.ru',
                           'galkinapnq1996@list.ru',
                           'gorbachyovasyq1978@list.ru',
                           'petukhovadxt1980@list.ru',
                           'abramovapkt1985@list.ru',
                           'vasilevapwv1990@list.ru',
                           'seleznyovamty1986@list.ru',
                           'frolovarzf1979@list.ru',
                           'kryukovaznh1970@list.ru',
                           'prokhorovaarw1973@list.ru',
                           'krylovavso1972@list.ru',
                           'nikitinawdf1981@list.ru',
                           'voronovarda1987@list.ru',
                           'kazakovarjo1969@list.ru',
                           'gordeevazme1968@list.ru',
                           'frolovaajv1974@list.ru',
                           'rybakovagyd1974@list.ru',
                           'tjzvxg881k@dpptd.com',
                           'matveevaroh1971@list.ru',
                           '56sf0n82u5@dpptd.com',
                           'wq95dy0ujm@dpptd.com',
                           'billi124@rambler.ru',
                           'd9s7dd5nhy@rteet.com',
                           'f8b4x8yh9g@rteet.com',
                           '3n8d8biq8t@rteet.com',
                           'ssmir77@rambler.ru',
                           '6mvr3pwpph@rteet.com',
                           'plkusfcme4@dpptd.com',
                           'wv6qppsw50@rteet.com',
                           'orekhovapln1986@list.ru',
                           'www.angiepapathanasiou@yahoo.gr',
                           'kxxe9a9ljw@rteet.com',
                           'sharovaypu1970@list.ru',
                           'ponomaryovawat1980@list.ru',
                           'zresa4ml0z@dpptd.com',
                           'kolobovajbs1975@list.ru',
                           'amayk33@rambler.ru',
                           'dasmkw9gfz@dpptd.com',
                           '5098indigo@rustyload.com',
                           'veselovaqpr1983@list.ru',
                           'davydovahcs1970@list.ru',
                           'masht77@rambler.ru',
                           '4nvttk5z3t@tippabble.com',
                           'mbuzkton5c@rfcdrive.com',
                           'bykovaabj1996@list.ru',
                           'zaytsevajam1995@list.ru',
                           'shiryaevauox1988@list.ru',
                           'vardakop@rambler.ru',
                           'cf8eec26e3@mailmaxy.one',
                           'dorofeevaqfj1972@list.ru',
                           'a0ae65f3fa@mailmaxy.one',
                           'd9b51fa894@mailmaxy.one',
                           '8ec59d0312@mailmaxy.one',
                           'galiakb1@rambler.ru',
                           'blinovauok1984@list.ru',
                           'sobollex82@rambler.ru',
                           'maslovaeyd1983@list.ru',
                           'basv15@rambler.ru',
                           'kruvas1@rambler.ru',
                           'w6rlbpm0iv@vafyxh.com',
                           'zakharovashr1984@list.ru',
                           '83j5eh5znm@vvatxiy.com',
                           'larionovavgc1984@list.ru',
                           'jakszww2xc@bltiwd.com',
                           'titovarfb1976@list.ru',
                           '4mjolyt4sd@qzueos.com',
                           '30188490ec@mailmaxy.one',
                           'cupu0kv179@gonetor.com',
                           'ignatevauky1978@list.ru',
                           'zn11xhilba@tidissajiiu.com',
                           'yoa5aud665@somelora.com',
                           'galkinantb1969@list.ru',
                           'davydovajup1992@list.ru',
                           'sorokinaxdu1983@list.ru',
                           'hsgvkxnzhx@dygovil.com',
                           'fadeevaeuu1967@list.ru',
                           'nazarovasbw1972@list.ru',
                           'matveevaugm1981@list.ru',
                           'tikhonovagqu1993@list.ru',
                           'filippovaoft1972@list.ru',
                           'artemevacgl1990@list.ru',
                           'np3ado8dbt@dygovil.com',
                           'kotovaxht1983@list.ru',
                           'shestakovavpj1991@list.ru',
                           'lukinakkw1972@list.ru',
                           'smirnovarza1975@list.ru',
                           'crfa2dsuam@knmcadibav.com',
                           'rybakovaqip1989@list.ru',
                           'tretyakovaigl1976@list.ru',
                           'stepanovaukb1994@list.ru',
                           'samoylovakvq1991@list.ru',
                           'davydovadci1988@list.ru',
                           'ignatovaogu1982@list.ru',
                           'zhukovaauh1968@list.ru',
                           'korolyovaljm1974@list.ru',
                           'naumovapxg1985@list.ru',
                           'voronovakzt1971@list.ru',
                           'vladimirovakrz1993@list.ru',
                           'abramovazbl1992@list.ru',
                           'rozhkovahzc1969@list.ru',
                           'kabanovabgv1990@list.ru',
                           'bobrovaizz1988@list.ru',
                           'makarovasjo1973@list.ru',
                           'rusakovahhr1986@list.ru',
                           'kalininaqty1969@list.ru',
                           'stepanovauhd1990@list.ru',
                           'krylovaiwc1972@list.ru',
                           'samoylovacye1967@list.ru',
                           'efimovaojx1969@list.ru',
                           'sysoevazfm1967@list.ru',
                           'anisimovaega1990@list.ru',
                           'kate94@gonetor.com',
                           '03e2f17e7f@mailmaxy.one',
                           'nadyabazyleva@list.ru',
                           'lenaperm@zvvzuv.com',
                           'bolshakovaxwe1994@list.ru',
                           'dmitrievagqr1989@list.ru',
                           'olga.alekseevna.199975@mail.ru',
                           'chernyshova20110907@yandex.ru',
                           'ariana09082014h@gmail.com',
                           'olgasmirnova@tippabble.com',
                           'shilovalqj1978@list.ru',
                           'alekseevantg1973@list.ru',
                           '8b3a55235b@mailmaxy.one',
                           'fokinavha1994@list.ru',
                           'e15f668ea0@mailmaxy.one',
                           'igonit@qacmjeq.com',
                           'shashkovaenn1975@list.ru',
                           'koshelevaphl1980@list.ru',
                           'bespalovaiuq1993@list.ru',
                           'anisimovagfq1997@list.ru',
                           'artemevavad1982@list.ru',
                           'zhuravlyovapea1984@list.ru',
                           'gordeevadry1975@list.ru',
                           'zinovevaqdr1997@list.ru',
                           'strelkovaycx1976@list.ru',
                           'ekaperis@smykwb.com',
                           'braginavkz1987@list.ru',
                           'terentevalyw1971@list.ru',
                           'medvedevavad1974@list.ru',
                           'naumovaqws1989@list.ru',
                           'eliseevazlf1985@list.ru',
                           'petukhovareh1968@list.ru',
                           'bykovadcb1975@list.ru',
                           'rogovaqpd1974@list.ru',
                           'nikonovavnm1972@list.ru',
                           'dorofeevarzk1969@list.ru',
                           'isakovaooo1978@list.ru',
                           'evdokimovazjr1975@list.ru',
                           'shilovanol1981@list.ru',
                           'myasnikovaksu1996@list.ru',
                           'loginovavuz1995@list.ru',
                           'efeiyiv@rambler.ru',
                           'zuevaaem1995@list.ru',
                           'tikhonovamhd1977@list.ru',
                           'mgs1985@list.ru',
                           'kotovawmr1984@list.ru',
                           'oadevkina@list.ru',
                           'tulupova163@list.ru',
                           'rybakovanlf1966@list.ru',
                           'vitalikivanovkd1946@rambler.ua',
                           'johnb6flores@list.ru',
                           'dementevavhk1986@list.ru',
                           'romanovaedi1977@list.ru',
                           'bogdanovaakn1987@list.ru',
                           'zhdanovakzl1976@list.ru',
                           'wqnnaarxuy@myrambler.ru',
                           'makarovatiy1978@list.ru',
                           'kfllxgznpi@rambler.ru',
                           'belyaevabfo1985@list.ru',
                           'bbqsfijkbf@myrambler.ru',
                           'vazquezalbertozpl@rambler.ru',
                           'lavrentevahte1967@list.ru',
                           'seleznyovaakq1975@list.ru',
                           'setykh@list.ru',
                           'hmwda7cuh8f3e1@rambler.ru',
                           'galkinabgb1982@list.ru',
                           'sfrvsujsn@autorambler.ru',
                           'vasilevalrh1994@list.ru',
                           'hdmplciz@autorambler.ru',
                           'nikonovabgd1986@list.ru',
                           'turovazve1981@list.ru',
                           'ykktzpzm@autorambler.ru',
                           'smirnovahos1985@list.ru',
                           'osipovazlk1981@list.ru',
                           'efimovaxzu1974@list.ru',
                           'afanasevaemn1973@list.ru',
                           'romanvorobevbv6453@rambler.ru',
                           'braginalrm1967@list.ru',
                           'golubevavby1988@list.ru',
                           'timofeevahus1997@list.ru',
                           'bobrovapkn1986@list.ru',
                           'rodionovasij1971@list.ru',
                           'mikheevamvp1988@list.ru',
                           'edhczevxgl@rambler.ru',
                           'mishinamtx1989@list.ru',
                           'shashkovaofc1974@list.ru',
                           'simotrisgomerov1012@myrambler.ru',
                           'fedotovabaf1997@list.ru',
                           'rodionovaisq1996@list.ru',
                           'danbilledste@myrambler.ru',
                           'likhachyovaksl1971@list.ru',
                           'bykovaudh1981@list.ru',
                           'cheldonovadalfina987297@myrambler.ru',
                           'jxoa287h6ekhwq@rambler.ru',
                           'savinamvf1970@list.ru',
                           'nosovabud1977@list.ru',
                           'm-gronskii-1971@myrambler.ru',
                           'frszahkrf@rambler.ru',
                           'shiryaevajpv1982@list.ru',
                           'kulikovauqq1968@list.ru',
                           'biryukovafwg1987@list.ru',
                           'komissarovawsj1976@list.ru',
                           'samoylovakmg1984@list.ru',
                           'eligal@list.ru',
                           'yakovlevaykg1966@list.ru',
                           'blinovaqfq1991@list.ru',
                           'zuevaojx1990@list.ru',
                           'belozyorovabyt1982@list.ru',
                           'kolobovasam1987@list.ru',
                           'voronovanlk1986@list.ru',
                           'lqaeyyqb@myrambler.ru',
                           '65851d32ec@mailmaxy.one',
                           'e433ff8aff@mailmaxy.one',
                           'pavlihinanyurifa2001@autorambler.ru',
                           'b21c0247c1@mailmaxy.one',
                           'vinogradovazdk1983@list.ru',
                           'ershovajfr1975@list.ru',
                           'belyakovatdi1994@list.ru',
                           'gorbunovaujd1974@list.ru',
                           'jjenovashari1987384@myrambler.ru',
                           'savelevagrm1979@list.ru',
                           'nikitinaoli1981@list.ru',
                           'molchanovagqi1966@list.ru',
                           'rusakovakph1975@list.ru',
                           'mashapulova@bltiwd.com',
                           'safonovabuy1986@list.ru',
                           'golubev2010artem53921g@myrambler.ru',
                           'blinovavso1976@list.ru',
                           'korolev99borja08288n@myrambler.ru',
                           'anisimovabqg1966@list.ru',
                           'filippov2000artem63768s@myrambler.ru',
                           'sharapovahtd1974@list.ru',
                           'fomin9oleg50781z@myrambler.ru',
                           'cd729d8db9@mailmaxy.one',
                           'e059f9f580@mailmaxy.one',
                           'antonovamqk1991@list.ru',
                           'sokolov100borja38376l@myrambler.ru',
                           'dementevaypa1995@list.ru',
                           'arxcpmbbu@rambler.ru',
                           'vorontsovakec1994@list.ru',
                           'doroninafgk1991@list.ru',
                           'zhdanovaxby1986@list.ru',
                           'ovchinnikovabzj1979@list.ru',
                           'novikov9roma11011f@myrambler.ru',
                           'sashamsk@smykwb.com',
                           'chernov2011bogdan65585q@myrambler.ru',
                           'abramov99tolik59863j@myrambler.ru',
                           'savelevambz1981@list.ru',
                           'maxtula@qacmjeq.com',
                           'kuzminaskl1967@list.ru',
                           'eliseevaeai1973@list.ru',
                           'kuzminaiph1976@list.ru',
                           'deqczrgooi@rambler.ru',
                           'fkreoptionkne@autorambler.ru',
                           'trofimovanlc1970@list.ru',
                           'shubinarez1979@list.ru',
                           'nikitin2010konstantin33957e@myrambler.ru',
                           'markovamuh1972@list.ru',
                           'mikheevaplk1990@list.ru',
                           'ignatevaixs1986@list.ru',
                           'krylov9vitalij85951l@myrambler.ru',
                           'burovauqs1973@list.ru',
                           'harahordinachjan8462@rambler.ua',
                           'cwtmhfynrw@rambler.ru',
                           'nosovabkb1968@list.ru',
                           'tarasov2010vanja27922u@myrambler.ru',
                           'novikovardi1977@list.ru',
                           'murtazina1985@rambler.ua',
                           'sorokin2010evgenij10233c@myrambler.ru',
                           'sobolevabkf1966@list.ru',
                           'kgjfctz@autorambler.ru',
                           'teterinazua1980@list.ru',
                           'dyachkovaxsh1996@list.ru',
                           'terentevaygj1980@list.ru',
                           'ershovayeq1979@list.ru',
                           'efimov99artur94316q@myrambler.ru',
                           'dementevawxl1991@list.ru',
                           'deesxoffjj@rambler.ru',
                           'savelevaepy1991@list.ru',
                           'filippovafkn1993@list.ru',
                           'molchanovaojh1971@list.ru',
                           'knyazevafkz1988@list.ru',
                           'tsvetkovaaop1967@list.ru',
                           'shiryaevavlo1974@list.ru',
                           'lobanovaxvm1989@list.ru',
                           'smirnov2010vova70975t@myrambler.ru',
                           'timofeevaquh1971@list.ru',
                           'bivrzepeww@rambler.ru',
                           'dorofeevaoli1994@list.ru',
                           'grigorev9anatolij96385q@myrambler.ru',
                           'korolyovabid1970@list.ru',
                           'strelkovaczu1982@list.ru',
                           'ermakovazdg1966@list.ru',
                           'tretyakovaxpv1984@list.ru',
                           'savelev2010andrej52915d@myrambler.ru',
                           'konovalov99kolja84275l@myrambler.ru',
                           'pavlov100nikita28572k@myrambler.ru',
                           'konstantinovauar1973@list.ru',
                           'simonovaygy1972@list.ru',
                           'zaytsevaayo1989@list.ru',
                           'poljakov2010vitalij19487p@myrambler.ru',
                           'sukhanovaotx1982@list.ru',
                           'nikolaevaiby1990@list.ru',
                           'jpdllxgii@autorambler.ru',
                           'bozhana.uspenskaya.21_2000@mail.ru',
                           'teterinaymn1986@list.ru',
                           'nikitafilippoviu4010@rambler.ua',
                           'kiselev100borja22601s@myrambler.ru',
                           'ivetta_savina_39-2002@bk.ru',
                           'nana.aleshina-55-2002@inbox.ru',
                           'vjacheslavsorokinny8517@lenta.ru',
                           'leda-korovina-16_1998@bk.ru',
                           'lucirudaya@gmail.com',
                           'bogdanovawzx1996@list.ru',
                           'lisalopez18091992@rambler.ua',
                           'penfesiliya_gorlova-90-2005@mail.ru',
                           'karmen_aksenova.30_2003@bk.ru',
                           'darya.minaeva.52-1998@bk.ru',
                           'popovadwe1985@list.ru',
                           '9962406476@ro.ru',
                           'filipovichchur9638@rambler.ua',
                           'antonivanov_24@rambler.ua',
                           'lazarev2010vasja35843a@myrambler.ru',
                           'malika-petrovskaya_49.1996@bk.ru',
                           'rjane1989@mail.ru',
                           'vinogradov99mihail71717u@myrambler.ru',
                           'fxswyio@rambler.ru',
                           'branislava.kolesnikova-90_2005@list.ru',
                           'martynov2011sasha34583j@myrambler.ru',
                           'gippolita_sorokina-73_2004@bk.ru',
                           'koshelevatge1977@list.ru',
                           'solovev100valerij50908o@myrambler.ru',
                           'ilarionserbskii82@ro.ru',
                           'shestakovakix1996@list.ru',
                           'leshaborisovyl3774@lenta.ru',
                           'vasilisa.fedorova_33-1997@inbox.ru',
                           'nikonovamum1974@list.ru',
                           'vitalikabramovuc5743@lenta.ru',
                           'adriana-demidova.08.1996@bk.ru',
                           'antonovaxzn1993@list.ru',
                           'irina.25@rambler.ua',
                           'belousov.klement.1989@ro.ru',
                           'asiya-ermolaeva_37_2004@mail.ru',
                           'tolikchernovrw8782@lenta.ru',
                           'gella-surkova_18_2004@bk.ru',
                           'sergeeva-75.2002@mail.ru',
                           'mihailrodionovmk6581@lenta.ru',
                           'lazarev2000gena54130q@myrambler.ru',
                           'feoduliya.belyaeva.33-2002@bk.ru',
                           'gorokhova_julia@mail.ru',
                           'zhuravlyovazhw1987@list.ru',
                           'artemorlovnz5219@lenta.ru',
                           'artemida.moskvina_15_2005@bk.ru',
                           'kazakov2000slava64052g@myrambler.ru',
                           'magdalina-silina-39_2003@inbox.ru',
                           'mishinaaue1979@list.ru',
                           'zhozefina-mishina.40.1998@bk.ru',
                           'paloma-stepanova-70_1999@inbox.ru',
                           'semyonovaqgi1966@list.ru',
                           'borjakulikovpy7031@lenta.ru',
                           'anita_eliseeva.40_1999@bk.ru',
                           'mamontovajaf1980@list.ru',
                           'ana_steff@mail.ru',
                           'sakina-danilova-77_2005@bk.ru',
                           'rusakovabjm1983@list.ru',
                           'larionovautu1985@list.ru',
                           'elena-soloveva32284@rambler.ru',
                           'fraunastya911@yandex.ru',
                           'karima_merkusheva-76-1996@inbox.ru',
                           'poletta.nefedova-73_2000@inbox.ru',
                           'teaser_ignatova_39@rambler.ua',
                           'chernov2010vasilij75356l@myrambler.ru',
                           'ivansorokinis5703@lenta.ru',
                           'prokofeva-37_2002@mail.ru',
                           'vadikkiselevnn0077@lenta.ru',
                           'tsirtseya.kudryavtseva_94.2005@bk.ru',
                           'karpovavpz1969@list.ru',
                           'gurevarxk1974@list.ru',
                           'vasilina_2003_gerasimova@mail.ru',
                           'artem_1978@autorambler.ru',
                           '1320423882@ro.ru',
                           'beachampkierce94@rambler.ru',
                           'e0410dan@gmail.com',
                           'evgenijsemenovrq8147@lenta.ru',
                           'vikucan59@gmail.com',
                           'kovalev100ilja10214j@myrambler.ru',
                           'korolev99grigorij91046j@myrambler.ru',
                           'somm2003@mail.ru',
                           'yevgeniya.2002.bogdanova@mail.ru',
                           'novikova-ec8q0@rambler.ru',
                           'frolovaoii1980@list.ru',
                           'emelyanovaerv1979@list.ru',
                           'demidov.37.salavat@autorambler.ru',
                           'gorbunovavlm1984@list.ru',
                           'nikolajzhukovwm3154@lenta.ru',
                           'staceybrown9o@rambler.ru',
                           'v.t.fed@yandex.ru',
                           'kudryashovaqyu1986@list.ru',
                           'lyubava_loseva-64.2000@mail.ru',
                           'anisimovakiv1992@list.ru',
                           'isidora-basova.82-2001@mail.ru',
                           'zhenjaefimovbq6018@lenta.ru',
                           'dyachkovacjg1979@list.ru',
                           'zita-nesterova_49-1999@mail.ru',
                           'pashamedvedevdm5847@lenta.ru',
                           'tatea@inbox.ru',
                           'mariiagoncharova-35@rambler.ua',
                           'g-savelev-92@ro.ru',
                           'vwglfcd@autorambler.ru',
                           'stella.gardner.480691@ro.ru',
                           'boleslava.efimova.34-2004@bk.ru',
                           'koljaandreevtv2437@rambler.ru',
                           'makspavlovii0048@lenta.ru',
                           'vadimsergeevei3758@lenta.ru',
                           'agafonovacrs1994@list.ru',
                           'borispopovft8206@lenta.ru',
                           'grigorijaleksandroveu9699@lenta.ru',
                           'polyakovanhd1973@list.ru',
                           'vishnyakovagpv1994@list.ru',
                           'wisgriley@list.ru',
                           'julia.pozd13@gmail.com',
                           'zamfira_bragina_96.2001@list.ru',
                           'eleonoorka@yandex.ru',
                           'vatslava_tokareva_73_2002@mail.ru',
                           'savelevaigt1984@list.ru',
                           'diodora-shmeleva_88_2002@bk.ru',
                           'qdgkmjlqm@autorambler.ru',
                           'zakhira_belozyorova.31-2003@list.ru',
                           'ershovaxtp1977@list.ru',
                           'malanya-zvereva-48@bk.ru',
                           'naapnolha@mail.ru',
                           'zhenjanazarovhm1730@lenta.ru',
                           'filatovaxtv1985@list.ru',
                           'chernov2012borja87444k@myrambler.ru',
                           'pyuyumbonz@mail.ru',
                           'budaev1993@rambler.ua',
                           'viacheslav.grego.2000@rambler.ua',
                           'doroninanal1992@list.ru',
                           'leniana-lytkina_88@bk.ru',
                           'bazhena.frolova_2004@inbox.ru',
                           'naina-cherepanova-74@inbox.ru',
                           'radzha.mishina_68@bk.ru',
                           'murtazina-75ckz@rambler.ru',
                           'antonov2000pavel22432y@myrambler.ru',
                           'linda_bulgakova-78@inbox.ru',
                           'maksimovayuv1990@list.ru',
                           'safiya-izmaylova.85.2005@list.ru',
                           'romanovagyj1992@list.ru',
                           'yuniya_kalacheva.13@list.ru',
                           'muahsuntne@mail.ru',
                           '0891120935@ro.ru',
                           'popovaboq1981@list.ru',
                           'asiya.chernyaeva.29@inbox.ru',
                           'filonilla-kozlovskaya-99@list.ru',
                           'alekseevagxe1980@list.ru',
                           'caipoububbfer1985@mail.ru',
                           'kuznetsova_em6rd@rambler.ru',
                           '38irina_ermolina38@rambler.ua',
                           'laykamery@rambler.ru',
                           'fvwbhubhhs@autorambler.ru',
                           'valerijandreevbu9615@lenta.ru',
                           'lowmoleru1982@mail.ru',
                           'karinarudakova71@autorambler.ru',
                           'maksdmitrievhp4962@lenta.ru',
                           'matilda_doronina_41@bk.ru',
                           'prohorov9vasja46264a@myrambler.ru',
                           'gerasimov-1991-gerasimov@rambler.ua',
                           'iulia_2000@rambler.ua',
                           'mironov99maks51105l@myrambler.ru',
                           'maslov9kostja07210x@myrambler.ru',
                           'filina.rudneva.54@bk.ru',
                           'alona_frolova-85@list.ru',
                           'olgailjinskaya@yandex.ru',
                           'priskilla.zhukova_74@bk.ru',
                           'lzhdanich@bk.ru',
                           'ponomarev.42.vladislav@autorambler.ru',
                           'ermolova_eliza.93.1998@bk.ru',
                           'izot-kasatkina_46@bk.ru',
                           'tibatseca1971@mail.ru',
                           'oksana_belousova_42@ro.ru',
                           'jurijkiselevdy2799@lenta.ru',
                           'gennadijpetrovgr9773@lenta.ru',
                           'adeliya.romanova-99@inbox.ru',
                           'sasogu27@ro.ru',
                           'konovalov2010leha91625v@myrambler.ru',
                           'dimakiselevld4090@lenta.ru',
                           'baulina777@mail.ru',
                           'semenov99vova11827j@myrambler.ru',
                           'eva.dyakova_21@list.ru',
                           'tokha.kerel@ro.ru',
                           'susanmiller17031970@rambler.ua',
                           'vladmironovcd8433@lenta.ru',
                           'neonilla.dmitrieva.94@inbox.ru',
                           'becnidgcik@autorambler.ru',
                           'vitaliksergeevwg6559@lenta.ru',
                           'ada_yashina_81@list.ru',
                           'foundpadhemar1974@mail.ru',
                           'vladlena.zubkova_44@bk.ru',
                           'aleksandra-ozerova-04@list.ru',
                           'borismironovbh8994@lenta.ru',
                           'ustinya_kolpakova_10@list.ru',
                           'golovakovakatana19866079@rambler.ua',
                           'aleksandrkarimov-1996@ro.ru',
                           'decqvfhw@rambler.ru',
                           'xyztpersectsnif1988@mail.ru',
                           'lukina.gorelova.68@list.ru',
                           'filadelfiya.kuzmina-60@bk.ru',
                           'zhilina_semiramida.85.1998@bk.ru',
                           'aglaya.vlasova.301.2002@bk.ru',
                           'yrjoqevvv@autorambler.ru',
                           'abramov-0kg6x@rambler.ru',
                           'medvedev2012vadim97085l@myrambler.ru',
                           'boris-filatov73221@rambler.ru',
                           'jordan.dunn.368520@ro.ru',
                           'edna.terekhova_56@inbox.ru',
                           'barbaralewis07031984@ro.ru',
                           'lyubov_konstantinova_967.2001@mail.ru',
                           'vjacheslavrodionovsq2194@lenta.ru',
                           'raymonda_bobrova-673-1997@inbox.ru',
                           'evandra.kondrashova.774.1998@list.ru',
                           'evandra.myasnikova_356_2003@inbox.ru',
                           'sashawerbakovcg6125@lenta.ru',
                           'richard.motley.3572128@rambler.ru',
                           'bofcqvltft@rambler.ru',
                           'vladimirwerbakovcs7932@lenta.ru',
                           'donaldjones25081984@ro.ru',
                           'viktorkrylovsw8811@lenta.ru',
                           'afanasev1997fedorsdpfedor@mail.ru',
                           'anatolijbaranovrt6957@rambler.ru',
                           'evandra-orlova.562_2000@list.ru',
                           'dtyysxdpsn@rambler.ru',
                           'm.varshavina@inbox.ru',
                           'pelageya_kosareva_866.2003@list.ru',
                           'stoperinra1974@rambler.ru',
                           'pavlov2010viktor87952l@myrambler.ru',
                           'beatrisa-denisova-519-2002@list.ru',
                           'zifa-pakhomova.126_1997@list.ru',
                           'lapina_qt4hp@rambler.ru',
                           'domnina.ryabova.567.2002@list.ru',
                           'plotnikova-7osls@rambler.ru',
                           'ennava-lukyanova-2001@list.ru',
                           'kuzmin9anatolij87884m@myrambler.ru',
                           'lyuba.2020.loginova@mail.ru',
                           'zbwfmdbsng@rambler.ru',
                           'vasilev2000maks96333m@myrambler.ru',
                           'lyusi_krylova.2002@mail.ru',
                           'egorov2000vladimir29826i@myrambler.ru',
                           'vitalikisaevaq6269@lenta.ru',
                           'dmitriyev_maksim_1995@bk.ru',
                           'denisafanasevcs2545@lenta.ru',
                           'dmitrijkozlovtg8924@lenta.ru',
                           'sofoniya_bessonova.2002@mail.ru',
                           'lyudmila_prokhorova.2005@mail.ru',
                           'pavelabramovfu3862@rambler.ua',
                           'veshnyakova.snanduliya-70_1997@bk.ru',
                           'malvina_lobanova-1996@bk.ru',
                           'firuza-agafonova.2002@mail.ru',
                           'mavra_potapova-2004@list.ru',
                           '7003755422@ro.ru',
                           'elechka.shevchenko@inbox.ru',
                           'sanjaefimovap2534@lenta.ru',
                           'vitalijisaevif8917@lenta.ru',
                           'simovich2014@mail.ru',
                           'milyausha.glukhova-2000@mail.ru',
                           'elina-kozhevnikova_1998@inbox.ru',
                           'mrn066@yandex.ru',
                           'isaev99aleksandr55883b@myrambler.ru',
                           'andreev100vasilij76829w@myrambler.ru',
                           'maslov2011denis38457o@myrambler.ru',
                           'miranda.shchukina_2000@mail.ru',
                           'slavyana_dorofeeva_48_1997@inbox.ru',
                           'alekseev2012vova87378t@myrambler.ru',
                           'fetida_lukina_2005@bk.ru',
                           'arzun-smirnova-35@ro.ru',
                           'maksimov99roma22709s@myrambler.ru',
                           'koljakonovalovzi1714@lenta.ru',
                           'andreev100ruslan25632k@myrambler.ru',
                           'tavifa_komissarova_01_1997@mail.ru',
                           'valentina-mudar@autorambler.ru',
                           'e.carney@list.ru',
                           'rodionov2010vladislav09921b@myrambler.ru',
                           'zaira_lebedeva_46_1998@bk.ru',
                           'tarasnikitinxb7938@rambler.ua',
                           'golikova.ustinya-04.2001@mail.ru',
                           'vyacheslavpo6oj@rambler.ru',
                           'ivanov2012petr34914l@myrambler.ru',
                           'verislavapryahina1307@autorambler.ru',
                           'fomin2000artem76085b@myrambler.ru',
                           'kamila-dmitriyeva@bk.ru',
                           'yekaterina.2003.mironova@list.ru',
                           'grigorijkorolevwr6778@lenta.ru',
                           'nina.2016.soboleva@bk.ru',
                           'fedotov1987@autorambler.ru',
                           'gracheva.olga_70_2000@mail.ru',
                           'arina_2003_arina@list.ru',
                           'klimova.efrosinya-63-2004@mail.ru',
                           'my@edanilchenko.ru',
                           'shmeleva-piama.48-2002@list.ru',
                           'valikkalininnk6138@lenta.ru',
                           'kristinaoryshkova@yandex.ru',
                           'cherkasova-snezhana_90-1996@list.ru',
                           '4815241774@ro.ru',
                           'katyushkingederih@rambler.ua',
                           'danil-1996-belov@rambler.ua',
                           'polina.galei.1985@autorambler.ru',
                           'deevanarjisa038802@ro.ru',
                           'vadimbeljaevvx0128@lenta.ru',
                           'shumov_28_dima@rambler.ua',
                           'golubeva_naina_64_2003@list.ru',
                           'kochetova.alisa.81.2001@list.ru',
                           'mihailsavelevbd0527@lenta.ru',
                           'kolosova-svetoslava-99_2000@list.ru',
                           'kulikova-evdoksiya-53_2004@bk.ru',
                           'larionova.enona.45-2004@list.ru',
                           'inna_progne_1991@rambler.ua',
                           'dzhuletta-leonova-24-2002@mail.ru',
                           'aflpxuh@rambler.ru',
                           'iljazhukovec5872@lenta.ru',
                           'arina-maslennikova-53-1996@mail.ru',
                           'lenvilpesterov892069@autorambler.ru',
                           'sivilla-agafonova-22-1998@mail.ru',
                           'andrejvalejko@gmail.com',
                           'utkina.irida-10_1999@bk.ru',
                           'dmitrijpavlovss6510@lenta.ru',
                           'karpov99vitalik46598j@myrambler.ru',
                           'ijc1ucc0gmrjd9@rambler.ru',
                           'zinovii.sh.1982@autorambler.ru',
                           'nazarov2004sashabigxsasha@inbox.ru',
                           'rozanova-gaafa-00.2004@list.ru',
                           'karenina_2025@inbox.ru',
                           'rodionov9taras09973c@myrambler.ru',
                           'i.mitlashevskaya@mail.ru',
                           'aleksandr_smirnov_27@rambler.ua',
                           'bxaetuxuho@rambler.ru',
                           'karina.knyazeva.1992@list.ru',
                           'grecheninovamado1987@rambler.ua',
                           'idtiduicul1984@rambler.ru',
                           'cyrczmuxpx@rambler.ru',
                           'ibolman@list.ru',
                           'maksimovawi8k3@rambler.ru',
                           'zhukov2010vadim54966t@myrambler.ru',
                           '1664986936@ro.ru',
                           '38vlad-ivanov38@rambler.ua',
                           'yana.2011.frolova@inbox.ru',
                           'jessica.nelson.2019@bk.ru',
                           'azundastrelaa39@rambler.ua',
                           'irochka.melnikova.2002@mail.ru',
                           'kananreformatorskaya19948553@rambler.ua',
                           'ksyushenka_vysotskaya@list.ru',
                           'ronaldgarcia06121978@ro.ru',
                           'tihonov2000maks40399j@myrambler.ru',
                           'korneeva-mushira-58_1999@inbox.ru',
                           'anna_lowwood_1982@autorambler.ru',
                           'i.karmayeva@mail.ru',
                           'denisov2012kolja52532k@myrambler.ru',
                           'kondrashova-rima_24-1998@inbox.ru',
                           'vadikpopovdh2099@lenta.ru',
                           'lapteva-adelina_58-1996@list.ru',
                           'egorov2011nikita26833f@myrambler.ru',
                           'bogdanov2010pasha99292w@myrambler.ru',
                           'zhenjachernovpd1612@lenta.ru',
                           'donaldgonzalez14111985@rambler.ua',
                           'shckuratova.ya@yandex.ru',
                           'olegromanovrm4887@lenta.ru',
                           'shmeleva_epikasta_75_1998@bk.ru',
                           'orekhova_marta_89.1997@bk.ru',
                           'olakolla89@gmail.com',
                           'slavaegorovss9499@lenta.ru',
                           'nikitaau5ai@rambler.ru',
                           'muratova-evgeniya.83.1997@bk.ru',
                           'semina-gulzar_71-2005@bk.ru',
                           'borisova.agnessa-73.2001@list.ru',
                           'dmitrijbelovra7536@lenta.ru',
                           'ermolaeva.irina-57.2003@bk.ru',
                           'anna73.had@gmail.com',
                           'ruslanvlasovcm9185@lenta.ru',
                           'zolotova.sayfulla-65.2004@list.ru',
                           'ivanov2011anton63617z@myrambler.ru',
                           '1136175266@ro.ru',
                           'boboeva.maxina1990@gmail.com',
                           'vdovina_ninel_65.1996@inbox.ru',
                           'elenazhdanova-41@ro.ru',
                           'ekaterinakosheleva06@gmail.com',
                           'trofimova_stanislava.65-1998@inbox.ru',
                           'katyusha.2008.mikhaylova@mail.ru',
                           'strekalovskaya.86@mail.ru',
                           'zajcev2012dima17321h@myrambler.ru',
                           'zimina-tara_00-2001@bk.ru',
                           'maksmaksimovly7721@lenta.ru',
                           'boro87@yandex.ru',
                           'vlasova_aziza_13-1999@inbox.ru',
                           'corker-khudiakov-23@rambler.ua',
                           'donald.brown.9538812@rambler.ru',
                           'tata-koenigin@yandex.ru',
                           'katerina1996.playock25@autorambler.ru',
                           'elizarova_mstislava-40_2002@bk.ru',
                           'shilova-salikha.06.1999@list.ru',
                           'paramonova.aksinya-070_2004@list.ru',
                           'borjaisaevag8632@lenta.ru',
                           'anastasiia-menkib@rambler.ua',
                           'gorelova.petroniya_494.2001@bk.ru',
                           'kapustina_lada_370-2000@bk.ru',
                           'somova-bogdana-138_1996@mail.ru',
                           'akvvarel@mail.ru',
                           'kondrateva_zamfira.618_2005@list.ru',
                           'panova_vitaliya.027.2004@bk.ru',
                           'naumova-dilara-678_2000@inbox.ru',
                           'g.chernackowa2012@yandex.ru',
                           'taidjialdushin19913777@autorambler.ru',
                           'kseniya_dm@mail.ru',
                           'glukhova-solomeya_647.2001@inbox.ru',
                           'ivan_28@autorambler.ru',
                           'rudneva_linda-254_2001@list.ru',
                           'e95712359@gmail.com',
                           'ivanefimovqx0336@lenta.ru',
                           'aleshina_leniana.156-2005@inbox.ru',
                           'e9644484@gmail.com',
                           'denis-zongora@rambler.ua',
                           'yanakrasovskaya@mail.ru',
                           'lyubomira-sergeeva.94_1996@list.ru',
                           'zinaidamalanina5885@rambler.ua',
                           'zharova-praskovya-953-2002@bk.ru',
                           'diodora.kolobova-35_1999@bk.ru',
                           'erika-leonova-44_1998@bk.ru',
                           'andreypavlovv83@rambler.ru',
                           'anisimov-zm9nw@rambler.ru',
                           'stolyarova.vatslava-381-1997@inbox.ru',
                           'svetlana.1996.shcheglova@rambler.ua',
                           'lyudochka_belova_01@mail.ru',
                           '230107kl@gmail.com',
                           'petrov_43iuv@rambler.ru',
                           'epistimiya-popova_87_2001@inbox.ru',
                           'bggn7oqygk@rambler.ru',
                           'dzhuletta-krylova.54.1996@bk.ru',
                           '3746008005@ro.ru',
                           'vitalijaleksandrovyf9592@lenta.ru',
                           'xvlehuy@rambler.ru',
                           'vitalik.winded@rambler.ua',
                           'vitalina_koroleva-33-1996@mail.ru',
                           'kristinasouza2l@rambler.ru',
                           'dzhamilya.korotkova_53_1999@inbox.ru',
                           'vova1999-serpent22@rambler.ua',
                           'lyusi.levina-76_2004@mail.ru',
                           'hzargeboar@autorambler.ru',
                           'flnzxcqq@autorambler.ru',
                           'kseniia-clone-1979@rambler.ua',
                           'nastia-37@autorambler.ru',
                           'rauda_andreeva.2004@list.ru',
                           'ennava.vinogradova-35.2001@inbox.ru',
                           'dragomira_sotnikova-30-2002@bk.ru',
                           'irina1990.arsino31@rambler.ua',
                           'grigorev9slava82619c@myrambler.ru',
                           'raschet.magistral@mail.ru',
                           'dasha.orlova1992@mail.ru',
                           'volgaeva_irina@mail.ru',
                           'hanasty21@gmail.com',
                           'svecha555@inbox.ru',
                           'dizain-17@mail.ru',
                           'marina.danil4uck@yandex.ru',
                           'svetik.ru97@mail.ru',
                           'swa7aya@yandex.ru',
                           'zamira.vishnevskaya-44.1996@list.ru',
                           'zmyu@bk.ru',
                           'vadikvoronincv8996@lenta.ru',
                           'artyukhova.22@mail.ru',
                           'ivashincovsisto94@rambler.ua',
                           'epistimiya-goncharova.68.2004@list.ru',
                           'nechaev1983@rambler.ua',
                           'pavlina.trifonova_90.2002@inbox.ru',
                           'paulsmith27071991@ro.ru',
                           'enona.kolesova.81_2004@inbox.ru',
                           'kiseleva.1995.kiseleva@ro.ru',
                           'tanyasemak92@gmail.com',
                           'toljakorolevkt6428@lenta.ru',
                           'bazhena_komissarova-22_1996@mail.ru',
                           'vladilena_elizarova.23-2005@list.ru',
                           'elenakuznetsova.37@rambler.ua',
                           'kruzhalina.milanaf@yandex.ru',
                           'aleksandra_43@ro.ru',
                           'samantha.stone.094263@ro.ru',
                           'gorod213@bltiwd.com',
                           'kristina-amomal@rambler.ua',
                           'vikulich@rambler.ru',
                           'olegsedov.1986@ro.ru',
                           'serafima.smirnova_66-1996@inbox.ru',
                           'zafira_polyakova-58.2004@list.ru',
                           'poyankovskayaekaterina@mail.ru',
                           'vitaliyekb@vvatxiy.com',
                           'kiselev.kostia.hypopus@rambler.ua',
                           'alinakuc@somelora.com',
                           'pole-olesya@list.ru',
                           'yuliya_demina.64.1996@list.ru',
                           'denisov1996@autorambler.ru',
                           'valeriyasheglova@mail.ru',
                           'gusev2010borja00593c@myrambler.ru',
                           'aleksejsidorovyg1294@lenta.ru',
                           'belkova@tidissajiiu.com',
                           'hazel.diaz.032957@ro.ru',
                           'arturfedotovoh2856@lenta.ru',
                           'lukiana.rusanova.12-1996@mail.ru',
                           'tomachup@dygovil.com',
                           'melgog@mail.ru',
                           'd_fomin_1977@ro.ru',
                           'svetaantosh@gmail.com',
                           'artemklimovvg5017@lenta.ru',
                           'naina_ermolaeva_30_2002@inbox.ru',
                           'romchik@smykwb.com',
                           'zauresha712@mail.ru',
                           'belayaya_2020@mail.ru',
                           'tatyana.almazova.97@mail.ru',
                           'andreev2000andrej76623b@myrambler.ru',
                           'iljabaranovci2936@lenta.ru',
                           'lyubomira.zvereva.88.1998@inbox.ru',
                           'uliavizner20@gmail.com',
                           'alina.samsonova.37@ro.ru',
                           'a_terehina@mail.ru',
                           'alicevictory@vafyxh.com',
                           'kirillkarpovwzt1@rambler.ru',
                           'tatyana_zaytseva_48_2003@inbox.ru',
                           'lyubov.sukhanova.93.2003@list.ru',
                           'galka.k.a1985@gmail.com',
                           'mapaynetvwl@bk.ru',
                           'marianna_mesad@rambler.ua',
                           'nikitapovar@tippabble.com',
                           'zwwkvaxkco@rambler.ru',
                           'dionisiya_tretyakova_25_1996@list.ru',
                           'olga.ivanova_2015@mail.ru',
                           'nadezhda1993ponomareva@rambler.ua',
                           '148leonora-soboleva939@inbox.ru',
                           'yekaterina-2022-morozova@mail.ru',
                           'mertakova@rfcdrive.com',
                           '216karina.dyakonova266@inbox.ru',
                           'dolores_kopylova_50_1998@mail.ru',
                           'gloriya_gurova_93_1997@list.ru',
                           'marina.31@rambler.ua',
                           'ivancuk@somelora.com',
                           'romanov100mihail20954c@myrambler.ru',
                           'adksxdfz@rambler.ru',
                           'darina_morozova_05_1999@mail.ru',
                           'patruhtan@mail.ru',
                           'nekrasova.zamira@bk.ru',
                           '219anastasiya-zorina834@inbox.ru',
                           'nataliperova@qejjyl.com',
                           'wnvnwip@autorambler.ru',
                           'alisa1990.mataco31@rambler.ua',
                           '182dina-tsvetkova148@bk.ru',
                           'ratvalay@yandex.ru',
                           'dina_sinitsyna_37_1996@mail.ru',
                           'vadimtopov@vafyxh.com',
                           '863fatima_meshkova844@inbox.ru',
                           '692khaniyya-merkusheva858@bk.ru',
                           'evgeniya_ermola@mail.ru',
                           'edna_zimina_68_2005@inbox.ru',
                           'vitaliknovikovej7900@lenta.ru',
                           '1166805065@ro.ru',
                           'aleksejmakarovqg7795@lenta.ru',
                           'osmakovselan4352@autorambler.ru',
                           'eliza_pavlova_80_1996@bk.ru',
                           'astra_pavlova_23_1997@list.ru',
                           'shurovairina468@gmail.com',
                           'ksenasundieva@gmail.com',
                           'komarov9vjacheslav00486a@myrambler.ru',
                           'potehina_anastasiya0590@mail.ru',
                           'tolia.a.01@ro.ru',
                           'kchuklanova@inbox.ru',
                           'marfa-borodina-32-1999@bk.ru',
                           'elena_tinne@ro.ru',
                           'fedorovanataliya@bk.ru',
                           'titarevakamal19985692@autorambler.ru',
                           'nika-kruglova-96-2002@list.ru',
                           'xsljnnosua@rambler.ru',
                           'maysun-kryukova-65-1996@list.ru',
                           'anzelikasismareva6@gmail.com',
                           'panyukinaelkanida19891783@rambler.ua',
                           'domna_savitskaya_08_1999@inbox.ru',
                           'dolores_troshina_60_2001@mail.ru',
                           'linnikov_65eq8@rambler.ru',
                           'lukerya-grishina-13-2002@bk.ru',
                           'vendyulia1990@yandex.ru',
                           'smirnov99tolik16910l@myrambler.ru',
                           'makrina-kryukova-13-1997@list.ru',
                           'eqnqxzs@autorambler.ru',
                           'marfa-fedotova-67-2002@bk.ru',
                           'christopherscott26041993@ro.ru'
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
